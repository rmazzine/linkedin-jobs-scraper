import { RunStrategy, IRunStrategyResult } from "./RunStrategy";
import { Page } from "puppeteer";
import { IQuery } from "../query";
export declare const selectors: {
    container: string;
    jobs: string;
    links: string;
    applyLink: string;
    dates: string;
    companies: string;
    places: string;
    detailsTop: string;
    description: string;
    criteria: string;
    seeMoreJobs: string;
};
/**
 * @class LoggedOutRunStrategy
 * @extends RunStrategy
 */
export declare class LoggedOutRunStrategy extends RunStrategy {
    /**
     * Verify if authentication is required
     * @param {Page} page
     * @returns {Promise<boolean>}
     * @static
     * @private
     */
    private static _needsAuthentication;
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
    private static _loadJobDetails;
    /**
     * Try to load more jobs
     * @param page {Page}
     * @param jobLinksTot {number}
     * @param timeout {number}
     * @returns {Promise<ILoadResult>}
     * @private
     */
    private static _loadMoreJobs;
    /**
     * Accept cookies
     * @param {Page} page
     * @param {string} tag
     */
    private static _acceptCookies;
    /**
     * Run strategy
     * @param page
     * @param url
     * @param query
     * @param location
     */
    run: (page: Page, url: string, query: IQuery, location: string) => Promise<IRunStrategyResult>;
}
