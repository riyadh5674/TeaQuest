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

            .select("id, name")

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
   DIRECTORY
========================================================= */

async function loadDirectory() {

    if (!db) return;

    try {

        const { data } = await db

            .from("player_directory")

            .select("id, name, xp")


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


    requestContainer.innerHTML =
        incomingRequests.length
            ? incomingRequests.map(request => `

                <div class="buddy-row">

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


function appendFloorMessage(row, autoScroll = true) {

    if (floorSeenIds.has(row.id)) return;

    floorSeenIds.add(row.id);


    const container =
        $("#floorMessages");

    if (!container) return;


    const element =
        document.createElement("div");


    element.className =
        "chat-msg" +
        (row.sender_id === me() ? " own" : "");


    element.innerHTML = `

        <div class="chat-meta">

            <strong>${escapeHTML(nameOf(row.sender_id))}</strong>

            <small>${shortTime(row.created_at)}</small>

        </div>

        <div class="chat-body">
            ${escapeHTML(row.body)}
        </div>

    `;


    container.appendChild(element);


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


    if (!body) return;


    if (!allowSend()) {

        toast(
            "EASY THERE",
            "The tavern cannot hear you that fast."
        );

        return;

    }

    input.value = "";


    try {

        const { data, error } = await db

            .from("tavern_messages")

            .insert({
                sender_id: me(),
                body
            })

            .select()

            .single();


        if (error) throw error;


        if (data) {
            appendFloorMessage(data);
        }


        window.sfx?.blip?.();

    } catch (error) {

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


    const element =
        document.createElement("div");


    element.className =
        "chat-msg" +
        (row.sender_id === me() ? " own" : "");


    element.innerHTML = `

        <div class="chat-meta">

            <strong>
                ${escapeHTML(nameOf(row.sender_id))}
            </strong>

            <small>${shortTime(row.created_at)}</small>

        </div>

        <div class="chat-body">
            ${escapeHTML(row.body)}
        </div>

    `;


    container.appendChild(element);


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

    if (!body) return;


    input.value = "";


    try {

        const { data, error } = await db

            .from("direct_messages")

            .insert({
                sender_id: me(),
                recipient_id: activeDmPartner,
                body
            })

            .select()

            .single();


        if (error) throw error;


        if (data) {
            appendDmLetter(data);
        }


        window.sfx?.flip?.();

    } catch (error) {

        toast(
            "LETTER UNDELIVERED",
            "Only accepted buddies receive Tea Letters."
        );

        input.value = body;

    }

}


/* =========================================================
   REALTIME SUBSCRIPTIONS
========================================================= */

function subscribeRealtime() {

    if (!db) return;


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

        .subscribe();


    tavernChannelScrolls = db

        .channel("buddy-scrolls")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "friendships",
                filter: `addressee_id=eq.${me()}`
            },

            payload => {

                if (!payload.new) return;


                ensureName(payload.new.requester_id)

                    .then(() => {


                        refreshFriendState();


                        toast(
                            "BUDDY REQUEST",
                            `${nameOf(payload.new.requester_id)} wants to be your buddy!`
                        );


                        window.sfx?.coin?.();

                    });

            }

        )

        .subscribe();

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
