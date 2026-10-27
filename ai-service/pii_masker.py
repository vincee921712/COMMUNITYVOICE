import re

class PIIMasker:
    """
    Sanitizes citizen complaint text to comply with the Data Privacy Act of 2012 (RA 10173).
    Removes mobile numbers, emails, and sensitive identifiers before passing to external LLM APIs.
    """
    
    # Matches Philippine mobile numbers: +639xxxxxxxxx, 09xxxxxxxxx, 09xx-xxx-xxxx, etc.
    PH_MOBILE_REGEX = re.compile(
        r'(?:\+63\s?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|09\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|09\d{9})'
    )
    
    # Matches standard email addresses
    EMAIL_REGEX = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )
    
    # Matches Philippine Government IDs (e.g., PhilSys, SSS, TIN, PhilHealth)
    GOV_ID_REGEX = re.compile(
        r'\b(?:\d{4}-\d{4}-\d{4}-\d{4}|\d{2}-\d{7}-\d|\d{3}-\d{3}-\d{3}-\d{3})\b'
    )

    @classmethod
    def mask_text(cls, text: str, resident_name: str | None = None) -> str:
        if not text:
            return ""

        masked = cls.PH_MOBILE_REGEX.sub("[REDACTED_PHONE]", text)
        masked = cls.EMAIL_REGEX.sub("[REDACTED_EMAIL]", masked)
        masked = cls.GOV_ID_REGEX.sub("[REDACTED_ID]", masked)

        # Optionally mask resident's name if explicitly provided
        if resident_name and len(resident_name.strip()) > 2:
            name_parts = [re.escape(part) for part in resident_name.split() if len(part) > 2]
            if name_parts:
                name_pattern = re.compile(r'\b(?:' + '|'.join(name_parts) + r')\b', re.IGNORECASE)
                masked = name_pattern.sub("[REDACTED_NAME]", masked)

        return masked

