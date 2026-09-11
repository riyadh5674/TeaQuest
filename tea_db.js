/* =========================================================
   TEAQUEST — BACKEND LAYER (Firebase)
   Retrofits the app's supabase-style API onto Firebase
   (Auth + Firestore + Storage). Loaded BEFORE java.js.
   Exposes one global: db
========================================================= */
"use strict";

(function () {

    const fb = window.firebase;

    const db =
        fb && fb.auth && fb.firestore && fb.storage
            ? buildDb(fb)
            : null;

    window.db = db;

    if (db) {
        console.log("TeaQuest backend: Firebase ready");
    }


    function buildDb(firebase) {

        const auth = firebase.auth();
        const fs = firebase.firestore();
        const storageLib = firebase.storage();

        const serverTimestamp = () =>
            firebase.firestore.FieldValue.serverTimestamp();

        const col = (table) => {
            if (table === "player_directory") {
                return fs.collection("profiles");
            }
            return fs.collection(table);
        };


        /* ---------- helpers ---------- */

        function toAppUser(user) {
            return user
                ? {
                      id: user.uid,
                      email: user.email,
                      user_metadata: {
                          name: user.displayName || ""
                      }
                  }
                : null;
        }

        function friendlyError(error) {
            const code =
                (error && error.code) || "";
            const message =
                (error && error.message) ||
                "Something went wrong.";
            const map = {
                "auth/invalid-credential": "Wrong email or password.",
                "auth/wrong-password": "Wrong email or password.",
                "auth/user-not-found": "Wrong email or password.",
                "auth/invalid-login-credentials": "Wrong email or password.",
                "auth/email-already-in-use": "An account with that email already exists.",
                "auth/weak-password": "Password should be at least 6 characters.",
                "auth/user-disabled": "This account has been disabled.",
                "auth/too-many-requests": "Too many attempts. Please try again later.",
                "auth/operation-not-allowed": "Email/password sign in is not enabled.",
                "auth/network-request-failed": "Network error. Check your connection."
            };
            return { message: map[code] || message };
        }

        function whenAuth() {
            return new Promise((resolve) => {
                if (auth.currentUser) {
                    resolve(auth.currentUser);
                    return;
                }
                const off = auth.onAuthStateChanged(
                    (user) => { off(); resolve(user); },
                    () => { off(); resolve(null); }
                );
            });
        }

        function getUid() {
            const u = auth.currentUser;
            return u ? u.uid : null;
        }


        /* ---------- auth ---------- */

        const authApi = {

            async getSession() {
                const user = await whenAuth();
                if (!user) return { data: null };
                const appUser = toAppUser(user);
                return {
                    data: {
                        session: {
                            user: appUser,
                            access_token: user.uid
                        }
                    }
                };
            },

            async signInWithPassword({ email, password }) {
                try {
                    const cred = await auth.signInWithEmailAndPassword(
                        String(email || "").trim().toLowerCase(),
                        String(password || "")
                    );
                    const appUser = toAppUser(cred.user);
                    return {
                        data: {
                            user: appUser,
                            session: { user: appUser }
                        },
                        error: null
                    };
                } catch (error) {
                    return { data: null, error: friendlyError(error) };
                }
            },

            async signUp({ email, password, options }) {
                try {
                    const name =
                        (options && options.data && options.data.name) || "";
                    const cred =
                        await auth.createUserWithEmailAndPassword(
                            String(email || "").trim().toLowerCase(),
                            String(password || "")
                        );
                    if (name && cred.user) {
                        await cred.user
                            .updateProfile({ displayName: name })
                            .catch(() => {});
                    }
                    const appUser = toAppUser(cred.user);
                    return {
                        data: {
                            user: appUser,
                            session: { user: appUser }
                        },
                        error: null
                    };
                } catch (error) {
                    return { data: null, error: friendlyError(error) };
                }
            },

            async signOut() {
                try {
                    await auth.signOut();
                    return { error: null };
                } catch (error) {
                    return { error: friendlyError(error) };
                }
            },

            async resetPasswordForEmail(email) {
                try {
                    await auth.sendPasswordResetEmail(
                        String(email || "").trim().toLowerCase()
                    );
                    return { error: null };
                } catch (error) {
                    return { error: friendlyError(error) };
                }
            },

            /* legacy OTP flow is unused; Firebase uses email links */
            async verifyOtp() {
                return {
                    data: null,
                    error: {
                        message: "Password reset uses an email link instead."
                    }
                };
            },

            async updateUser(patch) {
                try {
                    const user = await whenAuth();
                    if (!user) {
                        return { error: { message: "Not signed in." } };
                    }
                    if (patch && patch.password) {
                        await user.updatePassword(String(patch.password));
                    }
                    if (patch && patch.email) {
                        await user.updateEmail(String(patch.email));
                    }
                    return { error: null };
                } catch (error) {
                    return { error: friendlyError(error) };
                }
            }

        };


        /* ---------- firestore query chain ---------- */

        function TeaChain(table, op) {
            this.table = table;
            this.op = op || "select";
            this.filters = [];
            this.orderCol = null;
            this.orderAsc = true;
            this.limitN = null;
            this.proj = null;
            this.pending = null;
            this.returnInserted = false;
            this.singleMode = null;
        }

        TeaChain.prototype.select = function (cols) {
            this.proj = cols || "*";
            if (this.op === "insert") {
                this.returnInserted = true;
            }
            return this;
        };

        TeaChain.prototype.eq = function (column, value) {
            this.filters.push([column, value]);
            return this;
        };

        TeaChain.prototype.order = function (column, options) {
            this.orderCol = column;
            this.orderAsc =
                !(options && options.ascending === false);
            return this;
        };

        TeaChain.prototype.limit = function (n) {
            this.limitN = Number(n) || 0;
            return this;
        };

        TeaChain.prototype.maybeSingle = function () {
            this.singleMode = "maybe";
            return this;
        };

        TeaChain.prototype.single = function () {
            this.singleMode = "single";
            return this;
        };

        TeaChain.prototype.insert = function (data) {
            this.op = "insert";
            this.pending = data;
            return this;
        };

        TeaChain.prototype.upsert = function (data) {
            this.op = "upsert";
            this.pending = data;
            return this;
        };

        TeaChain.prototype.update = function (data) {
            this.op = "update";
            this.pending = data;
            return this;
        };

        TeaChain.prototype.delete = function () {
            this.op = "delete";
            return this;
        };

        TeaChain.prototype.then = function (resolve, reject) {
            const p = this._exec();
            p.then(resolve, reject);
            return p;
        };


        function projectRow(doc, proj) {
            const raw = doc.data() || {};
            const data = Object.assign({}, raw);
            data.id = doc.id;
            if (!proj || proj === "*") return data;
            const parts = proj
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);
            const nested = [];
            const plain = [];
            let star = false;
            for (const part of parts) {
                if (part === "*") star = true;
                else if (/\(\*\)$/.test(part)) nested.push(part.slice(0, -3));
                else plain.push(part);
            }
            const out = { id: doc.id };
            if (star) {
                for (const key of Object.keys(data)) {
                    if (!nested.includes(key)) out[key] = data[key];
                }
            } else {
                for (const key of plain) {
                    if (key in data) out[key] = data[key];
                }
            }
            for (const key of nested) {
                if (key in data) out[key] = data[key];
            }
            return out;
        }

        function docIdFor(row) {
            if (row && row.id) return String(row.id);
            if (
                row &&
                row.user_id &&
                row.product_id
            ) {
                return `${row.user_id}_${row.product_id}`;
            }
            return null;
        }

        function splitFilters(filters) {
            const idF = filters.filter((f) => f[0] === "id");
            const rest = filters.filter((f) => f[0] !== "id");
            const idVal =
                idF.length ? idF[0][1] : null;
            return { idVal, rest };
        }

        function buildQuery(ref, rest) {
            let q = ref;
            for (const [c, v] of rest) {
                q = q.where(c, "==", v);
            }
            return q;
        }

        TeaChain.prototype._exec = async function () {

            const table = this.table;

            /* order_items legacy inserts append to the parent order */
            if (
                table === "order_items" &&
                this.op === "insert"
            ) {
                return appendOrderItems(this.pending);
            }

            const ref = col(table);
            const { idVal, rest } = splitFilters(this.filters);

            try {

                if (this.op === "select") {

                    if (idVal !== null) {
                        const doc = await ref.doc(String(idVal)).get();
                        const data = doc.exists ? projectRow(doc, this.proj) : null;
                        return afterSelect(data, this.singleMode);
                    }

                    let q = buildQuery(ref, rest);
                    if (this.orderCol && this.orderCol !== "id") {
                        q = q.orderBy(this.orderCol, this.orderAsc ? "asc" : "desc");
                    }
                    if (this.limitN > 0) {
                        q = q.limit(this.limitN);
                    }
                    const snap = await q.get();
                    const data = snap.docs.map((d) => projectRow(d, this.proj));
                    return afterSelect(data, this.singleMode);

                }

                if (this.op === "insert" || this.op === "upsert") {

                    const rows = Array.isArray(this.pending)
                        ? this.pending
                        : [this.pending];

                    const ids = [];
                    for (const row of rows) {
                        const useId = docIdFor(row);
                        const data = Object.assign({}, row);
                        delete data.id;
                        if (
                            table === "products" &&
                            !("created_at" in data)
                        ) {
                            data.created_at = serverTimestamp();
                        }
                        const docRef = useId
                            ? ref.doc(useId)
                            : ref.doc();
                        await docRef.set(data, { merge: true });
                        ids.push(docRef.id);
                    }

                    if (this.returnInserted) {
                        const doc = await ref.doc(ids[0]).get();
                        return {
                            data: doc.exists
                                ? projectRow(doc, this.proj)
                                : { id: ids[0] },
                            error: null
                        };
                    }

                    return { data: null, error: null };

                }

                if (this.op === "update") {

                    const patch = Object.assign({}, this.pending);
                    delete patch.id;

                    if (idVal !== null) {
                        await ref.doc(String(idVal)).set(patch, { merge: true });
                        return { data: null, error: null };
                    }

                    const snap = await buildQuery(ref, rest).get();
                    if (!snap.empty) {
                        const batch = fs.batch();
                        snap.docs.forEach((doc) =>
                            batch.set(doc.ref, patch, { merge: true })
                        );
                        await batch.commit();
                    }
                    return { data: null, error: null };

                }

                if (this.op === "delete") {

                    if (idVal !== null) {
                        await ref.doc(String(idVal)).delete();
                        return { data: null, error: null };
                    }

                    const snap = await buildQuery(ref, rest).get();
                    if (!snap.empty) {
                        const batch = fs.batch();
                        snap.docs.forEach((doc) => batch.delete(doc.ref));
                        await batch.commit();
                    }
                    return { data: null, error: null };

                }

                return { data: null, error: null };

            } catch (error) {
                return {
                    data: null,
                    error: {
                        message:
                            (error && error.message) ||
                            "Backend request failed."
                    }
                };
            }
        };

        function afterSelect(data, mode) {
            if (!mode) return { data, error: null };
            if (mode === "maybe") {
                if (Array.isArray(data)) {
                    return { data: data[0] || null, error: null };
                }
                return { data: data || null, error: null };
            }
            /* single */
            if (Array.isArray(data) && data.length > 1) {
                return { data: null, error: { message: "Multiple rows" } };
            }
            const row = Array.isArray(data) ? data[0] : data;
            if (Array.isArray(data) && data.length === 0) {
                return { data: null, error: null };
            }
            return { data: row || null, error: null };
        }

        async function appendOrderItems(pending) {
            try {
                const rows = Array.isArray(pending) ? pending : [pending];
                const byOrder = {};
                for (const row of rows) {
                    const oid = row.order_id;
                    if (!oid) continue;
                    (byOrder[oid] = byOrder[oid] || []).push({
                        product_id: row.product_id,
                        name: row.name,
                        price: Number(row.price),
                        quantity: row.quantity
                    });
                }
                for (const oid of Object.keys(byOrder)) {
                    const doc = await fs.collection("orders").doc(oid).get();
                    if (!doc.exists) continue;
                    const cur = doc.data().order_items || [];
                    const merged = cur.concat(byOrder[oid]);
                    await fs.collection("orders")
                        .doc(oid)
                        .update({ order_items: merged });
                }
                return { data: null, error: null };
            } catch (error) {
                return {
                    data: null,
                    error: { message: (error && error.message) || "Failed." }
                };
            }
        }


        /* ---------- rpc (create_order) ---------- */

        async function rpcCreateOrder(params) {
            const uid = getUid();
            if (!uid) {
                return { data: null, error: { message: "Not authenticated" } };
            }
            try {
                const user = auth.currentUser;
                const items = (params.p_items || []);
                if (!items.length) {
                    return { data: null, error: { message: "Cart is empty" } };
                }
                if (!String(params.p_customer || "").length ||
                    !String(params.p_address || "").length) {
                    return { data: null, error: { message: "Customer and address are required" } };
                }

                let total = 0;
                const rows = [];
                for (const it of items) {
                    const pDoc = await fs
                        .collection("products")
                        .doc(String(it.product_id))
                        .get();
                    if (!pDoc.exists) {
                        return {
                            data: null,
                            error: { message: "Unknown product " + it.product_id }
                        };
                    }
                    const p = pDoc.data();
                    const qty = Math.max(1, Math.min(99, Number(it.quantity) || 1));
                    rows.push({
                        product_id: p.id,
                        name: p.name,
                        price: Number(p.price),
                        quantity: qty
                    });
                    total += Number(p.price) * qty;
                }

                const orderRef = fs.collection("orders").doc();
                await orderRef.set({
                    user_id: uid,
                    customer: String(params.p_customer || ""),
                    address: String(params.p_address || ""),
                    phone: String(params.p_phone || ""),
                    payment: String(params.p_payment || "card"),
                    total: Number(total.toFixed(2)),
                    status: "PROCESSING",
                    created_at: serverTimestamp(),
                    order_items: rows
                });

                return { data: orderRef.id, error: null };
            } catch (error) {
                return {
                    data: null,
                    error: {
                        message: (error && error.message) || "Order failed."
                    }
                };
            }
        }

        function rpc(name, params) {
            if (name === "create_order") {
                return rpcCreateOrder(params || {});
            }
            return Promise.resolve({
                data: null,
                error: { message: "Unknown RPC " + name }
            });
        }


        /* ---------- realtime channels ---------- */

        const activeChannels = [];

        function TeaChannel(name, options) {
            this.name = name || "";
            this.options = options || {};
            this.listeners = [];
            this.unsubs = [];
            this.presenceMap = {};
            this.presenceCb = null;
            this.presenceTimer = null;
        }

        TeaChannel.prototype.on = function (type, config, cb) {
            this.listeners.push({
                type: type,
                config: config || {},
                cb: cb
            });
            return this;
        };

        TeaChannel.prototype._bindPostgres = function () {
            const pg = this.listeners.filter(
                (l) => l.type === "postgres_changes"
            );
            if (!pg.length) return;

            const tables = [...new Set(
                pg.map((l) => l.config.table).filter(Boolean)
            )];

            for (const table of tables) {
                const wanted = pg.filter((l) => l.config.table === table);
                let q = col(table);
                const filterCfg = wanted.find(
                    (l) => l.config.filter
                );
                if (filterCfg && filterCfg.config.filter) {
                    const m = /(\w+)=eq\.([^ ]+)/.exec(
                        String(filterCfg.config.filter)
                    );
                    if (m) q = q.where(m[1], "==", m[2]);
                }
                const unsub = q.onSnapshot(
                    (snap) => {
                        snap.docChanges().forEach((change) => {
                            const data = change.doc.data();
                            data.id = change.doc.id;
                            const etype = change.type; /* added|modified|removed */
                            const isAdd = etype === "added";
                            const isRemove = etype === "removed";
                            for (const l of wanted) {
                                const want = l.config.event || "*";
                                if (!(want === "*" ||
                                    (want === "INSERT" && isAdd) ||
                                    (want === "DELETE" && isRemove))) {
                                    continue;
                                }
                                const payload =
                                    isRemove
                                        ? { old: data }
                                        : { new: data };
                                try { l.cb(payload); } catch (err) {
                                    console.warn("realtime listener", err);
                                }
                            }
                        });
                    },
                    (err) => console.warn("Realtime error", err)
                );
                this.unsubs.push(unsub);
            }
        };

        TeaChannel.prototype._heartbeat = function () {
            const uid = getUid();
            if (!uid) return;
            fs.collection("presence")
                .doc(uid)
                .set({
                    user_id: uid,
                    name: auth.currentUser
                        ? auth.currentUser.displayName || ""
                        : "",
                    at: serverTimestamp()
                })
                .catch(() => {});
        };

        TeaChannel.prototype._bindPresence = function () {
            const pr = this.listeners.find(
                (l) => l.type === "presence"
            );
            if (!pr) return;
            const cb = pr.cb;

            const unsub = fs.collection("presence").onSnapshot(
                (snap) => {
                    const now = Date.now();
                    const map = {};
                    snap.forEach((doc) => {
                        const d = doc.data() || {};
                        let at = d.at ? d.at.toMillis ? d.at.toMillis() : 0 : 0;
                        if (now - at > 90000) return;
                        map[doc.id] = {
                            user_id: doc.id,
                            name: d.name || ""
                        };
                    });
                    this.presenceMap = map;
                    try { cb(); } catch (err) {
                        console.warn("presence listener", err);
                    }
                },
                () => {}
            );
            this.unsubs.push(unsub);

            if (!this.presenceTimer) {
                this.presenceTimer = setInterval(() => {
                    this._heartbeat();
                }, 20000);
            }
            this._heartbeat();
        };

        TeaChannel.prototype.subscribe = function (statusCb) {
            this._bindPostgres();
            this._bindPresence();
            if (typeof statusCb === "function") {
                /* let the snapshot listeners do the rest; signal ready */
                setTimeout(() => statusCb("SUBSCRIBED"), 50);
            }
            return this;
        };

        TeaChannel.prototype.track = function (payload) {
            const uid = getUid();
            if (!uid) return;
            const name =
                (payload && payload.name) ||
                (auth.currentUser ? auth.currentUser.displayName || "" : "");
            fs.collection("presence")
                .doc(uid)
                .set({
                    user_id: uid,
                    name: name,
                    at: serverTimestamp()
                })
                .catch(() => {});
            this.presenceMap[uid] = {
                user_id: uid,
                name: name
            };
            if (this.presenceCb) this.presenceCb();
        };

        TeaChannel.prototype.presenceState = function () {
            return this.presenceMap;
        };

        TeaChannel.prototype.unsubscribe = function () {
            this.unsubs.forEach((u) => {
                try { u(); } catch (e) {}
            });
            this.unsubs = [];
            if (this.presenceTimer) {
                clearInterval(this.presenceTimer);
                this.presenceTimer = null;
            }
        };

        function channel(name, options) {
            const c = new TeaChannel(name, options);
            activeChannels.push(c);
            return c;
        }

        function removeChannel(chan) {
            if (!chan) return;
            const idx = activeChannels.indexOf(chan);
            if (idx !== -1) activeChannels.splice(idx, 1);
            chan.unsubscribe();
        }


        /* ---------- storage ---------- */

        const storageApi = {
            from(bucket) {
                const prefix = bucket ? bucket + "/" : "";
                return {
                    async upload(path, blob, options) {
                        try {
                            const full =
                                prefix + String(path);
                            const task =
                                storageLib.ref(full).put(blob, {
                                    contentType:
                                        (options && options.contentType) ||
                                        (blob && blob.type) ||
                                        "application/octet-stream"
                                });
                            await task;
                            return { data: { path }, error: null };
                        } catch (error) {
                            return {
                                data: null,
                                error: {
                                    message:
                                        (error && error.message) ||
                                        "Upload failed."
                                }
                            };
                        }
                    },
                    async getPublicUrl(path) {
                        try {
                            const full = prefix + String(path);
                            const url = await storageLib
                                .ref(full)
                                .getDownloadURL();
                            return { data: { publicUrl: url }, error: null };
                        } catch (error) {
                            return {
                                data: { publicUrl: "" },
                                error: {
                                    message:
                                        (error && error.message) ||
                                        "Could not resolve URL."
                                }
                            };
                        }
                    }
                };
            }
        };


        /* ---------- seeding ---------- */

        async function seedProducts(list) {
            try {
                if (!Array.isArray(list) || !list.length) {
                    return false;
                }
                const snap = await fs.collection("products").limit(1).get();
                if (!snap.empty) return true;
                const batch = fs.batch();
                for (const p of list) {
                    const doc = fs.collection("products").doc(String(p.id));
                    batch.set(doc, {
                        id: p.id,
                        name: p.name,
                        category: p.category || "",
                        price: Number(p.price) || 0,
                        icon: p.icon || "🍵",
                        rating: Number(p.rating) || 5,
                        rarity: p.rarity || "common",
                        origin: p.origin || "",
                        flavor_notes: p.flavorNotes || "",
                        moods: p.moods || [],
                        flavor_profile: p.flavorProfile || [],
                        strength: p.strength || "medium",
                        description: p.description || "",
                        stock: Number(p.stock) || 50,
                        created_at: serverTimestamp()
                    });
                }
                await batch.commit();
                return true;
            } catch (error) {
                return false;
            }
        }


        return {
            auth: authApi,
            from: (table) => new TeaChain(table),
            rpc: rpc,
            channel: channel,
            removeChannel: removeChannel,
            storage: storageApi,
            seedProducts: seedProducts
        };

    }

})();