with open('D:/teaquest/java.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const name =')
actual_section = content[idx:idx+3000]

# Find the exact end of the signup block (the first } after navigateTo("shop"))
# The block ends with "}\n\n\nasync function logout()"
end_idx = actual_section.find('\n}\n\n\nasync function logout()')
if end_idx == -1:
    print("Could not find end marker")
    exit(1)

old_signup = actual_section[:end_idx + 1]  # Include the closing brace

print(f"Found exact section length: {len(old_signup)}")
print("First 200 chars:")
print(repr(old_signup[:200]))
print("Last 200 chars:")
print(repr(old_signup[-200:]))

# Save for use in replacement
with open('D:/teaquest/exact_old_signup.txt', 'w', encoding='utf-8') as f:
    f.write(old_signup)

print("Exact old_signup saved to exact_old_signup.txt")