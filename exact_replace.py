with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the exact old signup section
with open('D:/teaquest/exact_old_signup.txt', 'r', encoding='utf-8') as f:
    old_signup = f.read()

# New signup section
new_signup = """// ============ SIGNUP ============

    const firstName =
        $("#authFirstName")
            ?.value
            .trim();

    const lastName =
        $("#authLastName")
            ?.value
            .trim();

    const name =
        $("#authName")
            .value
            .trim();

    const phone =
        $("#authPhone")
            ?.value
            .trim();

    const dob =
        $("#authDOB")
            ?.value;

    const gender =
        $("#authGender")
            ?.value;

    const address1 =
        $("#authAddress1")
            ?.value
            .trim();

    const address2 =
        $("#authAddress2")
            ?.value
            .trim();

    const city =
        $("#authCity")
            ?.value
            .trim();

    const state =
        $("#authState")
            ?.value
            .trim();

    const postalCode =
        $("#authPostalCode")
            ?.value
            .trim();

    const country =
        $("#authCountry")
            ?.value;

    const newsletterOptIn =
        $("#authNewsletter")
            ?.checked;

    const smsOptIn =
        $("#authSMS")
            ?.checked;

    const marketingOptIn =
        $("#authMarketing")
            ?.checked;


    if (!firstName) {

        toast(
            "CHARACTER ERROR",
            "Enter your first name."
        );

        return;
    }

    if (!lastName) {

        toast(
            "CHARACTER ERROR",
            "Enter your last name."
        );

        return;
    }

    if (!name) {

        toast(
            "CHARACTER ERROR",
            "Enter your display name."
        );

        return;
    }

    if (!email) {

        toast(
            "CHARACTER ERROR",
            "Enter your email."
        );

        return;
    }

    if (password.length < 6) {

        toast(
            "CHARACTER ERROR",
            "Password must be at least 6 characters."
        );

        return;
    }

    // Validate email format
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {

        toast(
            "CHARACTER ERROR",
            "Enter a valid email address."
        );

        return;
    }

    // Validate DOB if provided (must be 13+)
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 13) {
            toast(
                "CHARACTER ERROR",
                "You must be at least 13 years old to register."
            );
            return;
        }
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
                data: {
                    name,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    date_of_birth: dob,
                    gender,
                    address_line1: address1,
                    address_line2: address2,
                    city,
                    state_province: state,
                    postal_code: postalCode,
                    country,
                    newsletter_opt_in: newsletterOptIn,
                    sms_opt_in: smsOptIn,
                    marketing_opt_in: marketingOptIn
                }
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

if old_signup in content:
    content = content.replace(old_signup, new_signup)
    with open('D:/teaquest/java.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully!')
else:
    print('OLD SIGNUP NOT FOUND')
    # Debug - check first 100 chars
    print(f'Actual starts with: {repr(content[content.find("const name ="):content.find("const name =")+100])}')
    print(f'Expected starts with: {repr(old_signup[:100])}')