import os
from openai import OpenAI

api_key = "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"

try:
    client = OpenAI(api_key=api_key)
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Hello, are you working?"}
        ]
    )
    print("Success!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
