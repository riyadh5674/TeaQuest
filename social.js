"use strict";


/* =========================================================
   THE TAVERN — friends, global chat, tea letters
   Loads after java.js + fx.js. Uses globals:
   $, $$, db, currentUser, escapeHTML, toast,
   navigateTo, openAuth
========================================================= */


let tavernBooted = false;

let tavernChannelFloor = null;

let tavernChannelLetters = null;

let tavernChannelScrolls = null;

let tavernPresenceChannel = null;


let directoryMap = {};

let onlineIds = new Set();

let friendsList = [];

let incomingRequests = [];

let outgoingRequests = [];

let activeDmPartner = null;

const dmUnreadCounts = {};

const floorSeenIds =
    new Set();

const dmSeenIds =
    new Set();

let lastTavernSendAt = 0;

let lastFriendshipSyncAt = 0;

let currentSearchTerm = "";


/* =========================================================
   SMALL HELPERS
========================================================= */

function me() {

    return currentUser ? currentUser.id : null;

}


function myName() {

    if (!currentUser) {
        return "Traveler";
    }

    return currentUser.name || "Traveler";

}


function shortTime(iso) {

    try {

        return new Date(iso)
            .toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
            );

    } catch (error) {

        return "";

    }

}


function nameOf(playerId) {

    const entry =
        directoryMap[playerId];

    return entry ? entry.name : "Brewer";

}


async function ensureName(playerId) {

    if (directoryMap[playerId]) {
        return nameOf(playerId);
    }

    try {

        const { data } = await db

            .from("player_directory")

            .select("id, name, avatar_url")

            .eq("id", playerId)

            .single();


        if (data) {

            directoryMap[data.id] = data;

            return data.name;

        }

    } catch (error) {
        /* fall through */
    }


    return "Brewer";

}


function avatarHtml(playerId, extraClass = "") {

    const entry =
        directoryMap[playerId];

    const url =
        entry && entry.avatar_url;


    if (url) {

        return `

            <img class="chat-avatar ${extraClass}"

                 src="${escapeHTML(url)}"

                 alt="">

        `;

    }


    const initial =
        nameOf(playerId)
            .charAt(0)
            .toUpperCase();


    return `

        <span class="chat-avatar ${extraClass}">
            ${escapeHTML(initial)}
        </span>

    `;

}


function msgBodyHtml(text) {

    const safe =
        escapeHTML(text || "");


    return safe.replace(

        /(https?:\/\/[^\s<]+)/g,

        match => `

            <a href="${match}"

               target="_blank"

               rel="noopener noreferrer">${match}</a>

        `

    );

}


/* =========================================================
   GATE / BOOT / SHUTDOWN
========================================================= */

window.refreshTavern = function () {

    const gate =
        $("#tavernGate");

    const app =
        $("#tavernApp");


    if (!gate || !app) {
        return;
    }


    if (!currentUser) {

        gate.classList.remove("hidden-field");

        app.classList.add("hidden-field");

        return;

    }


    app.classList.remove("hidden-field");

    gate.classList.add("hidden-field");


    if (!tavernBooted) {

        bootTavern();

    } else {

        renderFriendLists();

    }

};


async function bootTavern() {

    tavernBooted = true;


    await loadDirectory();

    await refreshFriendState();

    await loadFloorHistory();


    subscribePresence();

    subscribeRealtime();

}


window.shutdownTavern = function () {

    [tavernChannelFloor,
     tavernChannelLetters,
     tavernChannelScrolls,
     tavernPresenceChannel]
        .forEach(channel => {

            if (channel && db) {
                db.removeChannel(channel);
            }

        });


    tavernChannelFloor = null;

    tavernChannelLetters = null;

    tavernChannelScrolls = null;

    tavernPresenceChannel = null;


    tavernBooted = false;

    directoryMap = {};

    friendsList = [];

    incomingRequests = [];

    outgoingRequests = [];

    activeDmPartner = null;


    Object.keys(dmUnreadCounts)
        .forEach(key => delete dmUnreadCounts[key]);

    floorSeenIds.clear();

    dmSeenIds.clear();


    pendingFloorFile = null;

    pendingDmFile = null;

    renderUploadChip("floor", null);

    renderUploadChip("dm", null);


    const badge = $("#tavernBadge");

    if (badge) {

        badge.textContent = "0";

        badge.classList.add("hidden-field");

    }


    const floor =
        $("#floorMessages");

    const dm =
        $("#dmMessages");

    if (floor) floor.innerHTML = "";

    if (dm) dm.innerHTML = "";

};


$("#tavernLoginButton")
    ?.addEventListener("click", openAuth);


/* =========================================================
   UPLOADS — media attachments & avatars
========================================================= */

const TAVERN_MAX_BYTES =
    8 * 1024 * 1024;

let pendingFloorFile = null;

let pendingDmFile = null;

let filePickerContext = null;


const MIME_EXT_MAP = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/webm": "weba",
    "application/pdf": "pdf",
    "text/plain": "txt"
};


function attachmentAllowed(file) {

    if (!file) return false;

    if (file.size > TAVERN_MAX_BYTES) {
        return false;
    }


    if (MIME_EXT_MAP[file.type]) {
        return true;
    }


    return file.type.startsWith("image/") ||
           file.type.startsWith("video/") ||
           file.type.startsWith("audio/");

}


async function shrinkImage(file) {

    /* keep gifs & small images untouched */

    if (!file.type.startsWith("image/")) {
        return file;
    }

    if (file.type === "image/gif") {
        return file;
    }

    if (file.size < 300 * 1024) {
        return file;
    }


    try {

        const bitmap =
            await createImageBitmap(file);

        const longest =
            Math.max(bitmap.width, bitmap.height);

        if (longest <= 1600) {
            return file;
        }

        const scale =
            1600 / longest;

        const canvas =
            document.createElement("canvas");

        canvas.width =
            Math.round(bitmap.width * scale);

        canvas.height =
            Math.round(bitmap.height * scale);

        canvas.getContext("2d")

            .drawImage(
                bitmap,
                0,
                0,
                canvas.width,
                canvas.height
            );


        const blob =

            await new Promise(resolve =>

                canvas.toBlob(
                    resolve,
                    "image/jpeg",
                    0.85
                )

            );

        bitmap.close();


        if (!blob) return file;


        return new File(
            [blob],
            file.name.replace(/\.\w+$/, "") +
                ".jpg",
            { type: "image/jpeg" }
        );

    } catch (error) {

        return file;

    }

}


async function uploadAttachment(file) {

    if (!db || !me()) {

        throw new Error("NO_SESSION");

    }

    if (!attachmentAllowed(file)) {

        throw new Error("BAD_FILE");

    }


    const prepared =
        await shrinkImage(file);

    const ext =
        MIME_EXT_MAP[prepared.type] || "bin";

    const path =

        `${me()}/${Date.now()}-` +

        crypto.randomUUID() +

        `.${ext}`;


    const { error } = await db.storage

        .from("tavern_media")

        .upload(path, prepared, {

            contentType: prepared.type,

            upsert: false

        });


    if (error) throw error;


    const { data } = db.storage

        .from("tavern_media")

        .getPublicUrl(path);


    return {
        url: data.publicUrl,

        type: prepared.type,

        name: file.name

    };

}


function formatBytes(bytes) {

    if (bytes >= 1048576) {
        return (bytes / 1048576).toFixed(1) + " MB";
    }

    return Math.max(1,
        Math.round(bytes / 1024)) + " KB";

}


function renderUploadChip(context, file) {

    const chip =

        context === "floor"

            ? $("#uploadChipFloor")

            : $("#uploadChipDm");

    if (!chip) return;


    if (!file) {

        chip.classList.add("hidden-field");

        chip.innerHTML = "";

        return;

    }


    chip.classList.remove("hidden-field");

    chip.innerHTML = `

        <span class="chip-name">
            📎 ${escapeHTML(file.name)}
            <small>(${formatBytes(file.size)})</small>
        </span>

        <button type="button" class="chip-remove"
                data-chip-remove="${context}">✕</button>

    `;

}


document.addEventListener("click", event => {


    const removeChip =

        event.target.closest("[data-chip-remove]");

    if (removeChip) {

        const context =

            removeChip.dataset.chipRemove;

        setPendingFile(context, null);

        return;

    }


    const opener =

        event.target.closest("#floorAttachButton, #dmAttachButton");

    if (opener) {

        filePickerContext =

            opener.id === "floorAttachButton"

                ? "floor"

                : "dm";

        $("#tavernFileInput")?.click();

    }


    const avatarButton =

        event.target.closest("[data-social='avatar']");

    if (avatarButton) {

        filePickerContext = "avatar";

        $("#tavernFileInput")?.click();

    }


    const lightboxOpen =

        event.target.closest("[data-lightbox]");

    if (lightboxOpen) {

        openLightbox(

            lightboxOpen.dataset.lightboxSrc,

            lightboxOpen.dataset.lightbox

        );

    }


    if (event.target.id === "lightbox") {

        closeLightbox();

    }

});


$("#tavernFileInput")

    ?.addEventListener("change", async event => {


        const input = event.target;

        const file = input.files?.[0];

        input.value = "";


        if (!file) return;


        if (filePickerContext === "avatar") {

            await handleAvatarUpload(file);

            return;

        }


        if (!attachmentAllowed(file)) {

            toast(

                "FILE REJECTED",

                "Max 8 MB. Images, video, audio, PDF or text."

            );

            return;

        }


        setPendingFile(filePickerContext, file);

    });


function setPendingFile(context, file) {

    if (context === "floor") {

        pendingFloorFile = file;

    } else {

        pendingDmFile = file;

    }

    renderUploadChip(context, file);

}


async function handleAvatarUpload(file) {

    if (!me()) return;

    if (!file.type.startsWith("image/")) {

        toast("AVATARS ARE IMAGES", "Pick a picture file.");

        return;

    }

    if (file.size > TAVERN_MAX_BYTES) {

        toast("TOO HEAVY", "Keep avatars under 8 MB.");

        return;

    }


    toast("UPLOADING", "Painting your portrait...");


    try {


        const bitmap = await createImageBitmap(file);

        const size = 256;

        const canvas = document.createElement("canvas");

        canvas.width = size;

        canvas.height = size;


        const side = Math.min(bitmap.width, bitmap.height);

        canvas.getContext("2d").drawImage(

            bitmap,

            (bitmap.width - side) / 2,

            (bitmap.height - side) / 2,

            side,

            side,

            0,

            0,

            size,

            size

        );

        bitmap.close();


        const blob = await new Promise(resolve =>

            canvas.toBlob(resolve, "image/png")

        );

        if (!blob) throw new Error("ENCODE_FAIL");


        const path =

            `${me()}/avatar-${Date.now()}.png`;


        const { error } = await db.storage

            .from("tavern_media")

            .upload(path, blob, {

                contentType: "image/png",

                upsert: true

            });

        if (error) throw error;


        const { data } = db.storage

            .from("tavern_media")

            .getPublicUrl(path);


        const url = data.publicUrl;


        await db

            .from("profiles")

            .update({ avatar_url: url })

            .eq("id", me());


        if (directoryMap[me()]) {

            directoryMap[me()].avatar_url = url;

        } else {

            directoryMap[me()] = {

                id: me(),

                name: myName(),

                xp: currentUser.xp || 0,

                avatar_url: url

            };

        }


        renderCrewCard();

        renderFriendLists();

        renderSearchResults();


        toast("PORTRAIT SAVED", "Looking sharp, brewer.");

        window.sfx?.achievement?.();

    } catch (error) {

        console.error(error);

        toast("AVATAR FAILED", "Upload did not survive the trip.");

    }

}


/* =========================================================
   LIGHTBOX
========================================================= */

function openLightbox(url, type) {

    const box =

        $("#lightbox");

    if (!box) return;


    let inner;

    if (type && type.startsWith("video/")) {

        inner = `

            <video src="${escapeHTML(url)}"

                   controls autoplay></video>

        `;

    } else {

        inner = `

            <img src="${escapeHTML(url)}" alt="">

        `;

    }


    box.innerHTML = `

        <button class="lightbox-close">✕</button>

        ${inner}

    `;


    box.querySelector(".lightbox-close")

        ?.addEventListener("click", closeLightbox);


    box.classList.remove("hidden-field");

}


function closeLightbox() {

    const box = $("#lightbox");

    if (!box) return;

    box.innerHTML = "";

    box.classList.add("hidden-field");

}


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeLightbox();
    }

});


/* =========================================================
   DIRECTORY
========================================================= */

async function loadDirectory() {

    if (!db) return;

    try {

        const { data } = await db

            .from("player_directory")

            .select("id, name, xp, avatar_url")


            .order("xp", { ascending: false })


            .limit(200);


        directoryMap = {};


        (data || []).forEach(row => {

            directoryMap[row.id] = row;

        });

    } catch (error) {

        toast(
            "TAVERN CLOSED",
            "Could not load the player directory."
        );

    }

}


$("#buddySearch")?.addEventListener(
    "input",
    event => {

        currentSearchTerm =
            event.target.value.trim().toLowerCase();

        renderSearchResults();

    }
);


function renderSearchResults() {

    const container =
        $("#searchResults");

    if (!container) return;


    if (!currentSearchTerm) {

        container.innerHTML =
            `<p class="tavern-empty">
                Type a name to find brewers.
             </p>`;

        return;

    }


    const matches =
        Object.values(directoryMap)

            .filter(player =>
                player.id !== me() &&
                player.name.toLowerCase()
                    .includes(currentSearchTerm)
            )

            .slice(0, 8);


    if (!matches.length) {

        container.innerHTML =
            `<p class="tavern-empty">No brewers found.</p>`;

        return;

    }


    const knownIds =
        new Set([

            ...friendsList.map(f => f.id),

            ...outgoingRequests.map(r => r.partnerId),

            ...incomingRequests.map(r => r.playerId)

        ]);


    container.innerHTML =
        matches.map(player => {


            const known =
                knownIds.has(player.id);


            const online =
                onlineIds.has(player.id);


            return `

                <div class="buddy-row">

                    ${avatarHtml(player.id)}

                    <span class="presence-dot ${online ? "on" : ""}"></span>

                    <strong>${escapeHTML(player.name)}</strong>

                    <small>LVL ${getLevelFromXpSafe(player.xp)}</small>

                    ${known
                        ? `<button class="pixel-button tiny" disabled>SENT</button>`
                        : `<button class="pixel-button primary tiny"
                               data-social="request"
                               data-id="${player.id}">
                              + BUDDY
                          </button>`}

                </div>

            `;

        }).join("");

}


function getLevelFromXpSafe(xp) {

    if (typeof getLevelInfo === "function") {

        return getLevelInfo(xp || 0).level;

    }

    return 1;

}


/* =========================================================
   FRIENDSHIPS
========================================================= */

async function refreshFriendState() {

    if (!db || !me()) return;


    let rows = [];


    try {

        const { data } = await db

            .from("friendships")

            .select("*");

        rows = data || [];

    } catch (error) {

        toast(
            "SCROLL ERROR",
            "Could not read your buddy scrolls."
        );

        return;

    }


    friendsList = [];

    incomingRequests = [];

    outgoingRequests = [];


    for (const row of rows) {


        if (row.status === "accepted") {


            const partnerId =
                row.requester_id === me()
                    ? row.addressee_id
                    : row.requester_id;


            await ensureName(partnerId);


            friendsList.push({
                id: partnerId,
                rowId: row.id,
                name: nameOf(partnerId)
            });

        } else if (
            row.status === "pending" &&
            row.addressee_id === me()
        ) {

            await ensureName(row.requester_id);

            incomingRequests.push({
                rowId: row.id,
                playerId: row.requester_id,
                name: nameOf(row.requester_id)
            });

        } else if (
            row.status === "pending" &&
            row.requester_id === me()
        ) {

            await ensureName(row.addressee_id);

            outgoingRequests.push({
                rowId: row.id,
                partnerId: row.addressee_id,
                name: nameOf(row.addressee_id)
            });

        }

    }


    renderSearchResults();

    renderFriendLists();

}


function renderFriendLists() {

    const requestContainer =
        $("#requestList");

    const friendContainer =
        $("#friendsList");

    const badge =
        $("#requestCount");


    if (!requestContainer ||
        !friendContainer) {
        return;
    }


    if (badge) {
        badge.textContent =
            incomingRequests.length;
    }


    updateTavernBadge();

    renderCrewCard();


    requestContainer.innerHTML =
        incomingRequests.length
            ? incomingRequests.map(request => `

                <div class="buddy-row">

                    ${avatarHtml(request.playerId)}

                    <strong>
                        ${escapeHTML(request.name)}
                    </strong>

                    <span class="buddy-actions">

                        <button class="pixel-button primary tiny"
                                data-social="accept"
                                data-row="${request.rowId}">
                            ✓ ACCEPT
                        </button>

                        <button class="pixel-button tiny"
                                data-social="decline"
                                data-row="${request.rowId}">
                            ✕
                        </button>

                    </span>

                </div>

              `).join("")
            : `<p class="tavern-empty">No pending requests.</p>`;


    friendContainer.innerHTML =
        friendsList.length
            ? friendsList.map(friend => {


                const unread =
                    dmUnreadCounts[friend.id] || 0;


                const online =
                    onlineIds.has(friend.id);


                return `

                    <div class="buddy-row">

                        ${avatarHtml(friend.id)}

                        <span class="presence-dot ${online ? "on" : ""}"></span>

                        <strong>${escapeHTML(friend.name)}</strong>

                        ${unread
                            ? `<span class="badge unread">${unread}</span>`
                            : ""}

                        <span class="buddy-actions">

                            <button class="pixel-button primary tiny"
                                    data-social="open-dm"
                                    data-id="${friend.id}">
                                ✉ TALK
                            </button>

                            <button class="pixel-button tiny"
                                    data-social="remove"
                                    data-row="${friend.rowId}"
                                    title="Remove buddy">
                                ✕
                            </button>

                        </span>

                    </div>

                `;

              }).join("")
            : `<p class="tavern-empty">
                  No buddies yet. Search above!
               </p>`;

}


function renderCrewCard() {

    const card =
        $("#crewCard");

    if (!card || !me()) return;


    card.classList.remove("hidden-field");


    const entry = directoryMap[me()];

    const online = onlineIds.has(me());


    card.innerHTML = `

        <div class="crew-top">

            ${avatarHtml(me(), "crew-avatar")}

            <div class="crew-info">

                <strong>${escapeHTML(myName())}</strong>

                <small>
                    LVL ${getLevelFromXpSafe(entry?.xp || currentUser?.xp)}
                    · ${online ? "ONLINE" : "OFFLINE"}
                </small>

            </div>

        </div>

        <button class="pixel-button tiny"
                data-social="avatar">
            📷 CHANGE PORTRAIT
        </button>

    `;

}


function updateTavernBadge() {

    const badge = $("#tavernBadge");

    if (!badge) return;


    const total =

        Object.values(dmUnreadCounts)

            .reduce((sum, n) => sum + n, 0);


    badge.textContent = total;

    badge.classList.toggle("hidden-field", !total);

}


document.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest("[data-social]");

        if (!button) return;


        const action =
            button.dataset.social;

        const id =
            button.dataset.id;

        const rowId =
            button.dataset.row;


        button.disabled = true;


        try {

            if (action === "request") {
                await sendFriendRequest(id);
            } else if (action === "accept") {
                await acceptRequest(rowId);
            } else if (action === "decline") {
                await declineRequest(rowId);
            } else if (action === "remove") {
                await removeBuddy(rowId);
            } else if (action === "open-dm") {
                openDm(id);
            }

        } finally {

            button.disabled = false;

        }

    }
);


async function sendFriendRequest(targetId) {

    if (!me() || !targetId) return;


    if (targetId === me()) {

        toast(
            "HELLO YOURSELF",
            "You are already your best buddy."
        );

        return;

    }


    const { error } = await db

        .from("friendships")

        .insert({
            requester_id: me(),
            addressee_id: targetId
        });


    if (error) {

        toast(
            "SCROLL ALREADY SENT",
            "You have a pending scroll with this brewer."
        );

        return;

    }


    toast(
        "BUDDY REQUEST",
        "Your scroll was delivered."
    );


    window.sfx?.coin?.();

    await refreshFriendState();

}


async function acceptRequest(rowId) {

    const { error } = await db

        .from("friendships")

        .update({ status: "accepted" })

        .eq("id", rowId)


        .eq("addressee_id", me());


    if (error) {

        toast(
            "ACCEPT FAILED",
            "Try again in a moment."
        );

        return;

    }


    toast(
        "NEW BREW BUDDY!",
        "You can now exchange Tea Letters."
    );


    window.sfx?.achievement?.();

    await refreshFriendState();

}


async function declineRequest(rowId) {

    await db

        .from("friendships")

        .delete()

        .eq("id", rowId)

        .eq("addressee_id", me());


    await refreshFriendState();

}


async function removeBuddy(rowId) {

    await db

        .from("friendships")

        .delete()

        .eq("id", rowId);


    if (activeDmPartner) {

        const stillFriend =
            friendsList.some(
                f => f.id === activeDmPartner
            );

        if (!stillFriend) {
            showFloor();
        }

    }


    await refreshFriendState();

}


/* =========================================================
   TABS
========================================================= */

function showFloor() {

    activeDmPartner = null;


    $("#tabFloor")
        ?.classList.add("active");

    $("#tabLetters")
        ?.classList.add("hidden-field");

    $("#tabLetters")
        ?.classList.remove("active");

    $("#floorPane")
        ?.classList.remove("hidden-field");

    $("#dmPane")
        ?.classList.add("hidden-field");

}


function openDm(partnerId) {

    if (!friendsList.some(f => f.id === partnerId)) {

        toast(
            "NOT A BUDDY YET",
            "Accept their scroll first."
        );

        return;

    }


    activeDmPartner =
        partnerId;


    dmUnreadCounts[partnerId] = 0;

    renderFriendLists();


    $("#tabLetters").textContent =
        `✉ WITH ${nameOf(partnerId).toUpperCase()}`;


    $("#tabLetters")
        ?.classList.remove("hidden-field");

    $("#tabLetters")
        ?.classList.add("active");

    $("#tabFloor")
        ?.classList.remove("active");

    $("#dmPane")
        ?.classList.remove("hidden-field");

    $("#floorPane")
        ?.classList.add("hidden-field");


    const header =
        $("#dmHeader");


    if (header) {

        const online =
            onlineIds.has(partnerId);

        header.innerHTML = `

            <span class="presence-dot ${online ? "on" : ""}"></span>

            <strong>${escapeHTML(nameOf(partnerId))}</strong>

            <small>PRIVATE TEA LETTERS</small>

        `;

    }


    $("#dmMessages").innerHTML = "";

    loadDmHistory();

}


$("#tabFloor")?.addEventListener(
    "click",
    showFloor
);


$("#tabLetters")?.addEventListener(
    "click",
    () => {

        if (activeDmPartner) {
            openDm(activeDmPartner);
        }

    }
);


/* =========================================================
   CHAT — TAVERN FLOOR
========================================================= */

async function loadFloorHistory() {

    if (!db) return;


    const container =
        $("#floorMessages");

    if (!container) return;


    try {

        const { data } = await db

            .from("tavern_messages")

            .select("*")

            .order("created_at", { ascending: false })

            .limit(40);


        const messages =
            (data || []).slice().reverse();


        for (const message of messages) {

            await ensureName(message.sender_id);

            appendFloorMessage(message, false);

        }


        container.scrollTop =
            container.scrollHeight;

    } catch (error) {

        /* silent — history is optional */

    }

}


function nearBottom(container) {

    return container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
        80;

}


function messageAttachmentHtml(row) {

    if (!row.attachment_url) return "";


    const type = row.attachment_type || "";

    const url = escapeHTML(row.attachment_url);


    if (type.startsWith("image/")) {

        return `

            <img class="chat-image"

                 src="${url}"

                 alt="${escapeHTML(row.attachment_name || "image")}"

                 loading="lazy"

                 data-lightbox="image"

                 data-lightbox-src="${url}">

        `;

    }


    if (type.startsWith("video/")) {

        return `

            <video class="chat-video" controls preload="metadata"

                   src="${url}"

                   data-lightbox="video"

                   data-lightbox-src="${url}"></video>

        `;

    }


    if (type.startsWith("audio/")) {

        return `

            <audio controls preload="metadata" src="${url}"></audio>

        `;

    }


    return `

        <a class="chat-file" href="${url}"

           target="_blank" rel="noopener noreferrer"

           download>

            📄 ${escapeHTML(row.attachment_name || "file")}

        </a>

    `;

}


function buildMessageElement(row, ownClass) {

    const element =
        document.createElement("div");


    element.className =
        "chat-msg" +
        (ownClass ? " own" : "");

    element.dataset.mid = row.id;


    const deletable =

        row.sender_id === me()


            ? `

                <button class="msg-delete"

                        data-msg-del="${row.id}"

                        title="Delete message">✕</button>

              `

            : "";



    element.innerHTML = `

        ${deletable}

        <div class="chat-meta">

            ${avatarHtml(row.sender_id)}

            <strong>${escapeHTML(nameOf(row.sender_id))}</strong>

            <small>${shortTime(row.created_at)}</small>

        </div>

        ${row.body
            ? `<div class="chat-body">${msgBodyHtml(row.body)}</div>`
            : ""}

        ${messageAttachmentHtml(row)}

    `;


    return element;

}


function appendFloorMessage(row, autoScroll = true) {

    if (floorSeenIds.has(row.id)) return;

    floorSeenIds.add(row.id);


    const container =
        $("#floorMessages");

    if (!container) return;


    container.appendChild(

        buildMessageElement(
            row,
            row.sender_id === me()
        )

    );


    if (autoScroll) {

        container.scrollTop =
            container.scrollHeight;

    }

}


$("#floorForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        sendFloorMessage();

    }
);


async function sendFloorMessage() {

    const input =
        $("#floorInput");

    if (!input || !me()) return;


    const body =
        input.value.trim();


    if (!body && !pendingFloorFile) return;


    if (!allowSend()) {

        toast(
            "EASY THERE",
            "The tavern cannot hear you that fast."
        );

        return;

    }


    input.value = "";


    let attachment = null;


    if (pendingFloorFile) {

        try {

            attachment =

                await uploadAttachment(pendingFloorFile);

        } catch (error) {

            console.error(error);

            toast(

                "UPLOAD FAILED",

                error.message === "BAD_FILE"

                    ? "Max 8 MB — images, video, audio, PDF or text."

                    : "The raven dropped it. Try again."

            );

            setPendingFile("floor", null);

            return;

        }

    }


    try {

        const { data, error } = await db

            .from("tavern_messages")

            .insert({
                sender_id: me(),
                body: body ||
                    (attachment ? "📎 " + attachment.name : ""),
                attachment_url:
                    attachment ? attachment.url : "",
                attachment_type:
                    attachment ? attachment.type : "",
                attachment_name:
                    attachment ? attachment.name : ""
            })

            .select()

            .single();


        if (error) throw error;


        if (data) {
            appendFloorMessage(data);
        }


        setPendingFile("floor", null);

        window.sfx?.blip?.();

    } catch (error) {

        console.error(error);

        toast(
            "MESSAGE FAILED",
            "The tavern echo dropped it. Try again."
        );

    }

}


function allowSend() {

    const now =
        performance.now();


    if (now - lastTavernSendAt < 800) {
        return false;
    }

    lastTavernSendAt = now;

    return true;

}


/* =========================================================
   CHAT — TEA LETTERS (DMs)
========================================================= */

async function loadDmHistory() {

    if (!db ||
        !activeDmPartner) return;


    const container =
        $("#dmMessages");

    if (!container) return;


    try {

        const mine =
            `and(sender_id.eq.${me()},recipient_id.eq.${activeDmPartner})`;

        const theirs =
            `and(sender_id.eq.${activeDmPartner},recipient_id.eq.${me()})`;


        const { data } = await db

            .from("direct_messages")

            .select("*")

            .or(`${mine},${theirs}`)

            .order("created_at", { ascending: false })

            .limit(50);


        const letters =
            (data || []).slice().reverse();


        for (const letter of letters) {

            appendDmLetter(letter, false);

        }


        container.scrollTop =
            container.scrollHeight;

    } catch (error) {

        /* silent */

    }

}


function appendDmLetter(row, autoScroll = true) {

    if (dmSeenIds.has(row.id)) return;

    dmSeenIds.add(row.id);


    const container =
        $("#dmMessages");

    if (!container) return;


    container.appendChild(

        buildMessageElement(
            row,
            row.sender_id === me()
        )

    );


    if (autoScroll) {

        container.scrollTop =
            container.scrollHeight;

    }

}


$("#dmForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        sendDmLetter();

    }
);


async function sendDmLetter() {

    const input =
        $("#dmInput");


    if (!input ||
        !me() ||
        !activeDmPartner) return;


    const body =
        input.value.trim();

    if (!body && !pendingDmFile) return;


    input.value = "";


    let attachment = null;


    if (pendingDmFile) {

        try {

            attachment =

                await uploadAttachment(pendingDmFile);

        } catch (error) {

            console.error(error);

            toast(

                "UPLOAD FAILED",

                error.message === "BAD_FILE"

                    ? "Max 8 MB — images, video, audio, PDF or text."

                    : "The raven dropped it. Try again."

            );

            setPendingFile("dm", null);

            return;

        }

    }


    try {

        const { data, error } = await db

            .from("direct_messages")

            .insert({
                sender_id: me(),
                recipient_id: activeDmPartner,
                body: body ||
                    (attachment ? "📎 " + attachment.name : ""),
                attachment_url:
                    attachment ? attachment.url : "",
                attachment_type:
                    attachment ? attachment.type : "",
                attachment_name:
                    attachment ? attachment.name : ""
            })

            .select()

            .single();


        if (error) throw error;


        if (data) {
            appendDmLetter(data);
        }


        setPendingFile("dm", null);

        window.sfx?.flip?.();

    } catch (error) {

        console.error(error);
        input.value = body;

        toast(
            "LETTER UNDELIVERED",
            "Buddy list refreshed — try again."
        );

        refreshFriendState();

    }

}


document.addEventListener(
    "click",
    async event => {

        const button =

            event.target.closest("[data-msg-del]");

        if (!button) return;


        const messageId =
            button.dataset.msgDel;


        const floorRow =

            floorSeenIds.has(messageId)

                ? "tavern_messages"

                : "direct_messages";


        try {


            const { error } = await db

                .from(floorRow)

                .delete()

                .eq("id", messageId)


                .eq("sender_id", me());


            if (error) throw error;


            removeMessageElement(messageId);

            window.sfx?.bitter?.();

        } catch (error) {

            console.error(error);

            toast(
                "DELETE FAILED",
                "The ink refuses to fade."
            );

        }

    }

);


function removeMessageElement(messageId) {

    document

        .querySelectorAll(

            `[data-mid="${messageId}"]`

        )

        .forEach(node => node.remove());

}


/* =========================================================
   REALTIME SUBSCRIPTIONS
========================================================= */

function subscribeRealtime() {

    if (!db) return;


    tavernChannelScrolls = db

        .channel("buddy-scrolls")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "friendships"
            },

            payload =>
                queueFriendshipSync(payload)

        )

        .subscribe();


    tavernChannelFloor = db

        .channel("tavern-floor")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "tavern_messages"
            },

            payload => {

                if (!payload.new) return;


                ensureName(payload.new.sender_id)

                    .then(() => {

                        const container =
                            $("#floorMessages");

                        const stick =
                            container
                                ? nearBottom(container)
                                : true;

                        appendFloorMessage(
                            payload.new,
                            stick
                        );

                        if (
                            payload.new.sender_id !== me() &&
                            activeDmPartner === null
                        ) {
                            window.sfx?.tick?.();
                        }

                    });

            }

        )

        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "tavern_messages"
            },

            payload => {

                if (payload.old?.id) {
                    removeMessageElement(payload.old.id);
                }

            }

        )

        .subscribe();


    tavernChannelLetters = db

        .channel("tea-letters")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "direct_messages",
                filter: `recipient_id=eq.${me()}`
            },

            payload => {

                if (!payload.new) return;


                const letter =
                    payload.new;


                ensureName(letter.sender_id)

                    .then(async () => {


                        const dmVisible =

                            !$("#dmPane")
                                ?.classList
                                .contains("hidden-field");


                        if (
                            activeDmPartner ===
                                letter.sender_id &&
                            dmVisible
                        ) {

                            appendDmLetter(letter);

                            window.sfx?.flip?.();

                            return;

                        }


                        dmUnreadCounts[letter.sender_id] =
                            (dmUnreadCounts[letter.sender_id] || 0) + 1;


                        await refreshFriendState();

                        renderFriendLists();


                        toast(
                            "TEA LETTER RECEIVED",
                            `${nameOf(letter.sender_id)} wrote to you.`
                        );


                        window.sfx?.coin?.();

                    });

            }

        )

        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "direct_messages"
            },

            payload => {

                if (payload.old?.id) {
                    removeMessageElement(payload.old.id);
                }

            }

        )

        .subscribe();

}


function queueFriendshipSync(payload) {

    const record =
        payload.new || payload.old || {};


    const involved =
        me() &&
        (
            record.requester_id === me() ||
            record.addressee_id === me()
        );

    if (!involved) return;


    const now =
        performance.now();

    if (now - lastFriendshipSyncAt < 700) {
        return;
    }

    lastFriendshipSyncAt = now;


    const wasAlreadyFriend =
        friendsList.some(friend =>
            friend.id === record.requester_id ||
            friend.id === record.addressee_id
        );


    const becameAccepted =
        Boolean(
            payload.new &&
            payload.new.status === "accepted"
        );


    const incomingRequest =
        Boolean(
            payload.new &&
            payload.new.status === "pending" &&
            payload.new.addressee_id === me()
        );


    refreshFriendState()


        .then(() => {


            if (incomingRequest) {


                const requesterId =
                    record.requester_id;


                ensureName(requesterId)

                    .then(() => {

                        toast(
                            "BUDDY REQUEST",
                            `${nameOf(requesterId)} wants to be your buddy!`
                        );

                        window.sfx?.coin?.();

                    });

                return;

            }


            if (!becameAccepted || wasAlreadyFriend) {
                return;
            }


            const partnerId =
                record.requester_id === me()
                    ? record.addressee_id
                    : record.requester_id;


            toast(
                "NEW BREW BUDDY!",
                `${nameOf(partnerId)} joined your party.`
            );


            window.sfx?.achievement?.();

        });

}


function subscribePresence() {

    if (!db || !me()) return;


    tavernPresenceChannel = db

        .channel(
            "online-brewers",
            { config: { presence: { key: me() } } }
        )


        .on(
            "presence",
            { event: "sync" },
            () => {

                const state =
                    tavernPresenceChannel.presenceState();


                onlineIds =
                    new Set(Object.keys(state));


                const counter =
                    $("#onlineCount");

                if (counter) {
                    counter.textContent =
                        onlineIds.size;
                }


                renderSearchResults();

                renderFriendLists();

                updateDmHeaderDot();

            }

        )


        .subscribe(status => {

            if (status === "SUBSCRIBED") {

                tavernPresenceChannel.track({

                    user_id: me(),

                    name: myName()

                });

            }

        });

}


function updateDmHeaderDot() {

    if (!activeDmPartner) return;


    const header =
        $("#dmHeader");

    if (!header) return;


    const dot =
        header.querySelector(".presence-dot");

    if (dot) {

        dot.classList.toggle(
            "on",
            onlineIds.has(activeDmPartner)
        );

    }

}
