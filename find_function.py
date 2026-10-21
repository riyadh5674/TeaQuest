with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the handleAuthentication function start
idx = content.find('async function handleAuthentication')
if idx == -1:
    print("Function not found")
    exit(1)

print(f"Function starts at char {idx}")

# Find the matching closing brace for the handleAuthentication function
brace_count = 0
in_string = False
string_char = None
i = idx

while i < len(content):
    char = content[i]
    if not in_string and char in ('"', "'", '`'):
        in_string = True
        string_char = char
    elif in_string and char == string_char and (i == 0 or content[i-1] != '\\'):
        in_string = False
        string_char = None
    elif not in_string:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                print(f"Found matching brace at char {i}")
                section = content[idx:i+1]
                print(f"Section length: {len(section)} chars")
                with open('D:/teaquest/full_function.txt', 'w', encoding='utf-8') as out:
                    out.write(section)
                print("Saved to full_function.txt")
                break
    i += 1
    if i > idx + 20000:
        print("Search limit reached")
        break

if brace_count != 0:
    print(f"Unmatched braces: {brace_count}")