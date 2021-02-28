"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedOutRunStrategy = exports.selectors = void 0;
const RunStrategy_1 = require("./RunStrategy");
const events_1 = require("../events");
const utils_1 = require("../../utils/utils");
const logger_1 = require("../../logger/logger");
exports.selectors = {
    container: ".results__container.results__container--two-pane",
    jobs: ".jobs-search__results-list li",
    links: ".jobs-search__results-list li a.result-card__full-card-link",
    applyLink: "a[data-is-offsite-apply=true]",
    dates: 'time',
    companies: ".result-card__subtitle.job-result-card__subtitle",
    places: ".job-result-card__location",
    detailsTop: ".topcard__content-left",
    description: ".description__text",
    criteria: "li.job-criteria__item",
    seeMoreJobs: "button.infinite-scroller__show-more-button",
};
/**
 * @class LoggedOutRunStrategy
 * @extends RunStrategy
 */
class LoggedOutRunStrategy extends RunStrategy_1.RunStrategy {
    constructor() {
        super(...arguments);
        /**
         * Run strategy
         * @param page
         * @param url
         * @param query
         * @param location
         */
        this.run = (page, url, query, location) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let tag = `[${query.query}][${location}]`;
            let processed = 0;
            logger_1.logger.info(tag, "Opening", url);
            yield page.goto(url, {
                waitUntil: 'load',
            });
            // Verify if authentication is required
            if ((yield LoggedOutRunStrategy._needsAuthentication(page))) {
                logger_1.logger.error(tag, "Scraper failed to run in anonymous mode, authentication may be necessary for this environment. Please check the documentation on how to use an authenticated session.");
                return { exit: true };
            }
            // Wait for lazy loading jobs
            try {
                yield page.waitForSelector(exports.selectors.container, { timeout: 5000 });
            }
            catch (err) {
                logger_1.logger.info(tag, `No jobs found, skip`);
                return { exit: false };
            }
            let jobIndex = 0;
            // Pagination loop
            while (processed < query.options.limit) {
                yield LoggedOutRunStrategy._acceptCookies(page, tag);
                // Get number of all job links in the page
                let jobLinksTot = yield page.evaluate((linksSelector) => document.querySelectorAll(linksSelector).length, exports.selectors.links);
                if (jobLinksTot === 0) {
                    logger_1.logger.info(tag, `No jobs found, skip`);
                    break;
                }
                logger_1.logger.info(tag, "Jobs fetched: " + jobLinksTot);
                // Jobs loop
                while (jobIndex < jobLinksTot && processed < query.options.limit) {
                    tag = `[${query.query}][${location}][${processed + 1}]`;
                    let jobId;
                    let jobLink;
                    let jobApplyLink;
                    let jobTitle;
                    let jobCompany;
                    let jobPlace;
                    let jobDescription;
                    let jobDescriptionHTML;
                    let jobDate;
                    let jobSenorityLevel;
                    let jobFunction;
                    let jobEmploymentType;
                    let jobIndustries;
                    let loadJobDetailsResult;
                    try {
                        // Extract job main fields
                        logger_1.logger.debug(tag, `Evaluating selectors`, [
                            exports.selectors.links,
                            exports.selectors.companies,
                            exports.selectors.places,
                            exports.selectors.dates,
                        ]);
                        [jobId, jobTitle, jobCompany, jobPlace, jobDate] = yield page.evaluate((jobsSelector, linksSelector, companiesSelector, placesSelector, datesSelector, jobIndex) => {
                            return [
                                document.querySelectorAll(jobsSelector)[jobIndex]
                                    .getAttribute("data-id"),
                                document.querySelectorAll(linksSelector)[jobIndex].innerText,
                                document.querySelectorAll(companiesSelector)[jobIndex].innerText,
                                document.querySelectorAll(placesSelector)[jobIndex].innerText,
                                document.querySelectorAll(datesSelector)[jobIndex]
                                    .getAttribute('datetime')
                            ];
                        }, exports.selectors.jobs, exports.selectors.links, exports.selectors.companies, exports.selectors.places, exports.selectors.dates, jobIndex);
                        // Load job details and extract job link
                        logger_1.logger.debug(tag, `Evaluating selectors`, [
                            exports.selectors.links,
                        ]);
                        [jobLink, loadJobDetailsResult] = yield Promise.all([
                            page.evaluate((linksSelector, jobIndex) => {
                                const linkElem = document.querySelectorAll(linksSelector)[jobIndex];
                                linkElem.scrollIntoView();
                                linkElem.click();
                                return linkElem.getAttribute("href");
                            }, exports.selectors.links, jobIndex),
                            LoggedOutRunStrategy._loadJobDetails(page, jobTitle, jobCompany),
                        ]);
                        // Check if loading job details has failed
                        if (!loadJobDetailsResult.success) {
                            logger_1.logger.error(tag, loadJobDetailsResult.error);
                            this.scraper.emit(events_1.events.scraper.error, `${tag}\t${loadJobDetailsResult.error}`);
                            jobIndex += 1;
                            continue;
                        }
                        // Use custom description function if available
                        logger_1.logger.debug(tag, `Evaluating selectors`, [
                            exports.selectors.description
                        ]);
                        if ((_a = query.options) === null || _a === void 0 ? void 0 : _a.descriptionFn) {
                            [jobDescription, jobDescriptionHTML] = yield Promise.all([
                                page.evaluate(`(${query.options.descriptionFn.toString()})();`),
                                page.evaluate((selector) => {
                                    return document.querySelector(selector).outerHTML;
                                }, exports.selectors.description)
                            ]);
                        }
                        else {
                            [jobDescription, jobDescriptionHTML] = yield page.evaluate((selector) => {
                                const el = document.querySelector(selector);
                                return [el.innerText, el.outerHTML];
                            }, exports.selectors.description);
                        }
                        // Extract apply link
                        logger_1.logger.debug(tag, `Evaluating selectors`, [
                            exports.selectors.applyLink
                        ]);
                        jobApplyLink = yield page.evaluate((selector) => {
                            const applyBtn = document.querySelector(selector);
                            return applyBtn ? applyBtn.getAttribute("href") : null;
                        }, exports.selectors.applyLink);
                        // Extract other job fields
                        logger_1.logger.debug(tag, `Evaluating selectors`, [
                            exports.selectors.criteria
                        ]);
                        [
                            jobSenorityLevel,
                            jobFunction,
                            jobEmploymentType,
                            jobIndustries,
                        ] = yield page.evaluate((jobCriteriaSelector) => {
                            const items = document.querySelectorAll(jobCriteriaSelector);
                            const criteria = [
                                'Seniority level',
                                'Job function',
                                'Employment type',
                                'Industries'
                            ];
                            const nodeList = criteria.map(criteria => {
                                const el = Array.from(items)
                                    .find(li => li.querySelector('h3').innerText === criteria);
                                return el ? el.querySelectorAll('span') : [];
                            });
                            return Array.from(nodeList)
                                .map(spanList => Array.from(spanList)
                                .map(e => e.innerText).join(', '));
                        }, exports.selectors.criteria);
                    }
                    catch (err) {
                        const errorMessage = `${tag}\t${err.message}`;
                        this.scraper.emit(events_1.events.scraper.error, errorMessage);
                        jobIndex += 1;
                        continue;
                    }
                    // Emit data
                    this.scraper.emit(events_1.events.scraper.data, Object.assign(Object.assign({ query: query.query || "", location: location, jobId: jobId, jobIndex: jobIndex, link: jobLink }, jobApplyLink && { applyLink: jobApplyLink }), { title: jobTitle, company: jobCompany, place: jobPlace, description: jobDescription, descriptionHTML: jobDescriptionHTML, date: jobDate, senorityLevel: jobSenorityLevel, jobFunction: jobFunction, employmentType: jobEmploymentType, industries: jobIndustries }));
                    jobIndex += 1;
                    processed += 1;
                    logger_1.logger.info(tag, `Processed`);
                    if (processed < query.options.limit && jobIndex === jobLinksTot) {
                        logger_1.logger.info(tag, 'Fecthing new jobs');
                        jobLinksTot = yield page.evaluate((linksSelector) => document.querySelectorAll(linksSelector).length, exports.selectors.links);
                    }
                }
                // Check if we reached the limit of jobs to process
                if (processed === query.options.limit)
                    break;
                // Check if there are more jobs to load
                logger_1.logger.info(tag, "Checking for new jobs to load...");
                const loadMoreJobsResult = yield LoggedOutRunStrategy._loadMoreJobs(page, jobLinksTot);
                // Check if loading jobs has failed
                if (!loadMoreJobsResult.success) {
                    logger_1.logger.info(tag, "There are no more jobs available for the current query");
                    break;
                }
            }
            return { exit: false };
        });
    }
}
exports.LoggedOutRunStrategy = LoggedOutRunStrategy;
/**
 * Verify if authentication is required
 * @param {Page} page
 * @returns {Promise<boolean>}
 * @static
 * @private
 */
LoggedOutRunStrategy._needsAuthentication = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = new URL(yield page.url());
    return parsed.pathname.toLowerCase().includes("authwall");
});
/**
 * Wait for job details to load
 * @param page {Page}
 * @param jobTitle {string}
 * @param jobCompany {string}
 * @param timeout {number}
 * @returns {Promise<ILoadResult>}
 * @static
 * @private
 */
LoggedOutRunStrategy._loadJobDetails = (page, jobTitle, jobCompany, timeout = 2000) => __awaiter(void 0, void 0, void 0, function* () {
    const waitTime = 50;
    let elapsed = 0;
    let loaded = false;
    while (!loaded) {
        loaded = yield page.evaluate((jobTitle, jobCompany, selector) => {
            const jobHeaderRight = document.querySelector(selector);
            return jobHeaderRight &&
                jobHeaderRight.innerText.includes(jobTitle) &&
                jobHeaderRight.innerText.includes(jobCompany);
        }, jobTitle, jobCompany, exports.selectors.detailsTop);
        if (loaded)
            return { success: true };
        yield utils_1.sleep(waitTime);
        elapsed += waitTime;
        if (elapsed >= timeout) {
            return {
                success: false,
                error: `Timeout on loading job details`
            };
        }
    }
    return { success: true };
});
/**
 * Try to load more jobs
 * @param page {Page}
 * @param jobLinksTot {number}
 * @param timeout {number}
 * @returns {Promise<ILoadResult>}
 * @private
 */
LoggedOutRunStrategy._loadMoreJobs = (page, jobLinksTot, timeout = 2000) => __awaiter(void 0, void 0, void 0, function* () {
    const pollingTime = 100;
    let elapsed = 0;
    let loaded = false;
    let clicked = false;
    while (!loaded) {
        if (!clicked) {
            clicked = yield page.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                    return true;
                }
                else {
                    return false;
                }
            }, exports.selectors.seeMoreJobs);
        }
        loaded = yield page.evaluate((selector, jobLinksTot) => {
            window.scrollTo(0, document.body.scrollHeight);
            return document.querySelectorAll(selector).length > jobLinksTot;
        }, exports.selectors.links, jobLinksTot);
        if (loaded)
            return { success: true };
        yield utils_1.sleep(pollingTime);
        elapsed += pollingTime;
        if (elapsed >= timeout) {
            return {
                success: false,
                error: `Timeout on loading more jobs`
            };
        }
    }
    return { success: true };
});
/**
 * Accept cookies
 * @param {Page} page
 * @param {string} tag
 */
LoggedOutRunStrategy._acceptCookies = (page, tag) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const cookieButton = buttons.find(e => e.innerText.includes('Accept cookies'));
            if (cookieButton) {
                cookieButton.click();
            }
        });
    }
    catch (err) {
        logger_1.logger.debug(tag, "Failed to accept cookies");
    }
});
