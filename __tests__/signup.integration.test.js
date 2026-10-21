/**
 * TeaQuest — signup / login integration tests
 *
 * These load the REAL index.html and the REAL java.js into a jsdom
 * document and drive the actual `handleAuthentication` handler.
 *
 * They exist because the signup flow shipped broken twice:
 *   1. a stray brace made java.js unparseable, so the whole app
 *      script never executed;
 *   2. `const age` followed by `age--` threw a TypeError whenever a
 *      date of birth was supplied.
 *
 * A unit test on a copy of the logic would have caught neither.
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");

/* ---------------------------------------------------------
   A chainable mock of the Firebase adapter exposed as `db`.
   --------------------------------------------------------- */

function createQueryBuilder(tables) {
  const builder = {
    select: () => builder,
    limit: () => builder,
    order: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    insert: (rows) => {
      const list = Array.isArray(rows) ? rows : [rows];
      tables.push(...list);
      return Promise.resolve({ data: list, error: null });
    },
    upsert: (row) => {
      tables.push(row);
      return Promise.resolve({ data: row, error: null });
    },
    update: (row) => Promise.resolve({ data: row, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    then: (resolve, reject) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject)
  };

  return builder;
}

/* ---------------------------------------------------------
   Boot the real application inside jsdom.
   --------------------------------------------------------- */

function createApp() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  const dom = new JSDOM(html, {
    url: "https://teaquest.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });

  const { window } = dom;

  window.FIREBASE_CONFIG = {
    apiKey: "test-api-key",
    authDomain: "teaquest.test",
    projectId: "teaquest-test",
    storageBucket: "teaquest-test.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:test"
  };

  // The app talks to the outside world through a handful of globals
  // that normally live in fx.js / the browser.
  window.sfx = new Proxy({}, { get: () => () => {} });
  window.confettiBurst = () => {};
  window.legendaryPulse = () => {};
  window.pulseScreen = () => {};
  window.showLevelUp = () => {};
  window.recordArcadePlay = () => {};
  window.saveArcadeScore = () => {};
  window.awardArcadeXp = () => {};
  window.MC = {};

  const tables = {};
  const signUpCalls = [];
  const signInCalls = [];

  const mockDb = {
    tables,
    auth: {
      signUp: (payload) => {
        signUpCalls.push(payload);

        return Promise.resolve({
          data: {
            user: {
              id: "user-1",
              email: payload.email,
              user_metadata: payload.options
                ? payload.options.data
                : {}
            },
            session: { access_token: "token" }
          },
          error: null
        });
      },
      signInWithPassword: (payload) => {
        signInCalls.push(payload);

        return Promise.resolve({
          data: {
            user: {
              id: "user-1",
              email: payload.email,
              user_metadata: { name: "Test Brewer" }
            }
          },
          error: null
        });
      },
      signOut: () => Promise.resolve({ error: null })
    },
    from: (table) => {
      if (!tables[table]) tables[table] = [];
      return createQueryBuilder(tables[table]);
    },
    seedProducts: () => Promise.resolve({ data: [], error: null })
  };

  // Load the production scripts, in the same order as index.html.
  for (const file of ["utils.js", "security.js", "tea_db.js"]) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    window.eval(source);
  }

  // tea_db.js sets window.db to null when the Firebase SDK is not
  // present, so the mock has to be installed afterwards.
  window.db = mockDb;

  // java.js is a strict-mode classic script, so its top-level
  // function declarations live in the eval scope rather than on
  // `window`. Export the handful the tests drive. The shim has to
  // live in the SAME eval call, otherwise it cannot see them.
  const javaSource = fs.readFileSync(path.join(ROOT, "java.js"), "utf8");

  window.eval(
    `${javaSource}
    window.__teaquest = {
      handleAuthentication: handleAuthentication,
      setAuthMode: setAuthMode,
      calculateAge: calculateAge,
      getLevelInfo: getLevelInfo,
      escapeHTML: escapeHTML,
      shortOrderId: shortOrderId,
      getProductRarity: getProductRarity,
      initializeAuthentication: initializeAuthentication
    };
  `
  );

  return { dom, window, signUpCalls, signInCalls, tables };
}

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */

function fill(window, values) {
  for (const [id, value] of Object.entries(values)) {
    const element = window.document.getElementById(id);

    if (!element) {
      throw new Error(`Missing form field #${id}`);
    }

    element.value = value;

    if (element.type === "checkbox") {
      element.checked = Boolean(value);
    }
  }
}

const SIGNUP_FIELDS = {
  authEmail: "brewer@teaquest.dev",
  authFirstName: "Riyadh",
  authLastName: "Mohammed",
  authName: "Riyadh",
  authPhone: "+966555000111",
  authDOB: "1995-04-21",
  authGender: "male",
  authAddress1: "123 Tea Street",
  authAddress2: "Flat 4",
  authCity: "Riyadh",
  authState: "Riyadh Province",
  authPostalCode: "12345",
  authCountry: "SA"
};

function signupEvent() {
  return { preventDefault: () => {} };
}

/* =========================================================
   TESTS
   ========================================================= */

describe("registration flow", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.dom.window.close();
  });

  test("the app scripts parse and expose the auth handler", () => {
    expect(typeof app.window.__teaquest.handleAuthentication).toBe("function");
    expect(typeof app.window.__teaquest.setAuthMode).toBe("function");
  });

  test("signup with a date of birth does not throw", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, { ...SIGNUP_FIELDS, authPassword: "teapassword1" });

    // The bug this guards against threw here:
    //   TypeError: Assignment to constant variable.
    await expect(
      app.window.__teaquest.handleAuthentication(signupEvent())
    ).resolves.not.toThrow();
  });

  test("signup passes the email and password to Firebase", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, { ...SIGNUP_FIELDS, authPassword: "teapassword1" });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(1);
    expect(app.signUpCalls[0].email).toBe("brewer@teaquest.dev");
    expect(app.signUpCalls[0].password).toBe("teapassword1");
  });

  test("signup sends every profile field to Firebase metadata", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, { ...SIGNUP_FIELDS, authPassword: "teapassword1" });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    const data = app.signUpCalls[0].options.data;

    expect(data).toMatchObject({
      first_name: "Riyadh",
      last_name: "Mohammed",
      name: "Riyadh",
      phone: "+966555000111",
      date_of_birth: "1995-04-21",
      gender: "male",
      address_line1: "123 Tea Street",
      address_line2: "Flat 4",
      city: "Riyadh",
      state_province: "Riyadh Province",
      postal_code: "12345",
      country: "SA"
    });
  });

  test("signup records the communication preferences", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, {
      ...SIGNUP_FIELDS,
      authPassword: "teapassword1",
      authNewsletter: true,
      authSMS: false,
      authMarketing: true
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    const data = app.signUpCalls[0].options.data;

    expect(data.newsletter_opt_in).toBe(true);
    expect(data.sms_opt_in).toBe(false);
    expect(data.marketing_opt_in).toBe(true);
  });

  test("a profile row is written for the new account", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, { ...SIGNUP_FIELDS, authPassword: "teapassword1" });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    const profiles = app.tables.profiles || [];
    const created = profiles.find((row) => row.id === "user-1");

    expect(created).toBeDefined();
    expect(created.email).toBe("brewer@teaquest.dev");
    expect(created.first_name).toBe("Riyadh");
    expect(created.city).toBe("Riyadh");
  });

  test("rejects a 12 year old before contacting the server", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, {
      ...SIGNUP_FIELDS,
      authDOB: "2015-01-01",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(0);
  });

  test("accepts a 13 year old", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, {
      ...SIGNUP_FIELDS,
      authDOB: "2013-01-01",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(1);
  });

  test("rejects a malformed email before contacting the server", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, {
      ...SIGNUP_FIELDS,
      authEmail: "not-an-email",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(0);
  });

  test("rejects a short password before contacting the server", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, { ...SIGNUP_FIELDS, authPassword: "123" });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(0);
  });

  test("requires a first name and a last name", async () => {
    app.window.__teaquest.setAuthMode("signup");
    fill(app.window, {
      ...SIGNUP_FIELDS,
      authFirstName: "",
      authLastName: "",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(0);
  });
});

describe("login flow", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.dom.window.close();
  });

  test("login signs the user in", async () => {
    app.window.__teaquest.setAuthMode("login");
    fill(app.window, {
      authEmail: "brewer@teaquest.dev",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signInCalls).toHaveLength(1);
    expect(app.signInCalls[0].email).toBe("brewer@teaquest.dev");
  });

  test("login never leaks the password into metadata", async () => {
    app.window.__teaquest.setAuthMode("login");
    fill(app.window, {
      authEmail: "brewer@teaquest.dev",
      authPassword: "teapassword1"
    });

    await app.window.__teaquest.handleAuthentication(signupEvent());

    expect(app.signUpCalls).toHaveLength(0);
  });
});
