package com.social.auth.application.exceptions;

public class InvalidOtpException extends RuntimeException {
    public InvalidOtpException() { super("Invalid or expired OTP"); }
}