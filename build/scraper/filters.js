"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.experienceLevelFilter = exports.typeFilter = exports.timeFilter = exports.relevanceFilter = void 0;
exports.relevanceFilter = {
    RELEVANT: "R",
    RECENT: "DD",
};
exports.timeFilter = {
    ANY: "",
    DAY: process.env.LI_AT_COOKIE ? "r86400" : "1",
    WEEK: process.env.LI_AT_COOKIE ? "r604800" : "1,2",
    MONTH: process.env.LI_AT_COOKIE ? "r2592000" : "1,2,3,4",
};
exports.typeFilter = {
    FULL_TIME: "F",
    PART_TIME: "P",
    TEMPORARY: "T",
    CONTRACT: "C",
    INTERNSHIP: "I",
    VOLUNTEER: "V",
    OTHER: "O",
};
exports.experienceLevelFilter = {
    INTERNSHIP: "1",
    ENTRY_LEVEL: "2",
    ASSOCIATE: "3",
    MID_SENIOR: "4",
    DIRECTOR: "5",
    EXECUTIVE: "6",
};
