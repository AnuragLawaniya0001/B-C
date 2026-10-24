"""Custom exception classes for application domain errors."""


class NotFoundError(Exception):
    """Raised when a requested resource is not found."""
    pass


class ValidationError(Exception):
    """Raised when business logic or input validation fails."""
    pass


class UnauthorizedError(Exception):
    """Raised when authentication fails or is missing."""
    pass


class ForbiddenError(Exception):
    """Raised when an authenticated user lacks permissions or account is suspended."""
    pass
