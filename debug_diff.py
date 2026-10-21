with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const name =')
actual = content[idx:idx+2500]

expected = """const name =
        $("#authName")
            .value
            .trim();


    if (!name) {

        toast(
            "CHARACTER ERROR",
            "Enter your player name."
        );

        return;
    }


    if (!db) {

        toast(
            "BACKEND OFFLINE",
            "Cannot reach the server. Try again later."
        );

        return;
    }


    const { data, error } =
        await db.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

    if (error || !data.user) {

        toast(
            "SIGNUP FAILED",
            error
                ? error.message
                : "Could not create account."
        );

        return;
    }


    if (!data.session) {

        closeModal(
            $("#authModal")
        );


        toast(
            "CONFIRM YOUR EMAIL",
            "Check your inbox to activate your account, then log in."
        );

        return;
    }


    let profile = null;

    try {

        profile =
            await ensureProfile(data.user);

    } catch (profileError) {

        profile = null;

    }


    currentUser = profile
        ? mapProfile(profile)
        : {
              id: data.user.id,
              name,
              email,
              role: "player",
              xp: 0,
              discoveries: [],
              achievements: [],
              rouletteSpins: 0
          };


    saveStorage(
        "teaquest_currentUser",
        currentUser
    );


    await fetchFavorites();

    await fetchOrders();


    closeModal(
        $("#authModal")
    );


    renderEverything();

    toast(
        "CHARACTER CREATED",
        "Your tea adventure begins."
    );


    navigateTo("shop");

}"""

# Compare byte by byte
min_len = min(len(actual), len(expected))
for i in range(min_len):
    if actual[i] != expected[i]:
        print(f'Diff at pos {i}: actual={repr(actual[i])} expected={repr(expected[i])}')
        print(f'  Actual context: {repr(actual[max(0,i-20):i+20])}')
        print(f'  Expected context: {repr(expected[max(0,i-20):i+20])}')
        break
else:
    print('Strings match up to min length')
    print(f'Actual len: {len(actual)}, Expected len: {len(expected)}')
    if len(actual) != len(expected):
        print('Length difference!')
        if len(actual) > len(expected):
            print(f'Actual has extra: {repr(actual[len(expected):len(expected)+50])}')
        else:
            print(f'Expected has extra: {repr(expected[len(actual):len(actual)+50])}')