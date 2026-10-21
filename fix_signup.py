with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact old signup section by locating key markers
start_marker = 'const name =\n        $("#authName")\n            .value\n            .trim();\n\n\n    if (!name) {\n\n        toast(\n            "CHARACTER ERROR",\n            "Enter your player name."\n        );\n\n        return;\n    }'

# Find the start position
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    exit(1)

# Find the end - look for the closing of the handleAuthentication function
# which is after the navigateTo("shop") and the closing brace
end_marker = 'navigateTo("shop")\n\n}'

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("End marker not found")
    exit(1)

end_idx += len(end_marker)

print(f"Found section from {start_idx} to {end_idx}")

old_section = content[start_idx:end_idx]
print("Old section length:", len(old_section))

# New signup section
new_section = '''// ============ SIGNUP ============

    const firstName =
        $("#authFirstName")
            ?.value
            .trim()

    const lastName =
        $("#authLastName")
            ?.value
            .trim()

    const name =
        $("#authName")
            .value
            .trim()

    const phone =
        $("#authPhone")
            ?.value
            .trim()

    const dob =
        $("#authDOB")
            ?.value

    const gender =
        $("#authGender")
            ?.value

    const address1 =
        $("#authAddress1")
            ?.value
            .trim()

    const address2 =
        $("#authAddress2")
            ?.value
            .trim()

    const city =
        $("#authCity")
            ?.value
            .trim()

    const state =
        $("#authState")
            ?.value
            .trim()

    const postalCode =
        $("#authPostalCode")
            ?.value
            .trim()

    const country =
        $("#authCountry")
            ?.value

    const newsletterOptIn =
        $("#authNewsletter")
            ?.checked

    const smsOptIn =
        $("#authSMS")
            ?.checked

    const marketingOptIn =
        $("#authMarketing")
            ?.checked


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

}'''

# Replace
if start_marker in content:
    # Find the exact section by extending from start_marker to the function end
    section_start = content.find(start_marker)
    # Find the matching closing brace for handleAuthentication
    brace_count = 0
    in_string = False
    string_char = None
    i = section_start
    
    while i < len(content):
        char = content[i]
        if not in_string and (char == '"' or char == "'" or char == '`'):
            in_string = True
            string_char = char
        elif in_string and char == string_char and content[i-1] != '\\':
            in_string = False
            string_char = None
        elif not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    # Found the matching closing brace
                    section_end = i + 1
                    break
        i += 1
    
    if brace_count != 0:
        print("Could not find matching brace")
        exit(1)
    
    old_section = content[section_start:section_end]
    print(f"Found section: {len(old_section)} chars")
    
    new_content = content[:section_start] + new_section + content[section_end:]
    
    with open('D:/teaquest/java.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully!")
else:
    print("Start marker not found")