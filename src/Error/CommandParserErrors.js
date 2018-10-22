'use strict';

/**
 * Error used when the player enters an invalid command
 * @extends Error
 */
class InvalidCommandError extends Error {}

/**
 * Error used when the player tries a command they can't access
 * @extends Error
 */
class RestrictedCommandError extends Error {}

exports.InvalidCommandError = InvalidCommandError;
exports.RestrictedCommandError = RestrictedCommandError;