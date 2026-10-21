with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const name =')
if idx == -1:
    print("Not found")
    exit(1)

print(f"Start at char {idx}")

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
                # Save to file for inspection
                with open('D:/teaquest/old_section.txt', 'w', encoding='utf-8') as out:
                    out.write(section)
                print("Saved to old_section.txt")
                break
    i += 1
    if i > idx + 5000:
        print("Search limit reached")
        break