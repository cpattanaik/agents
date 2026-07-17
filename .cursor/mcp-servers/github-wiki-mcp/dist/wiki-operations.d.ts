export interface WikiConfig {
    owner: string;
    repo: string;
    token: string;
}
export interface WriteWikiPageArgs extends WikiConfig {
    pageName: string;
    content: string;
    commitMessage?: string;
}
export interface AppendToWikiPageArgs extends WikiConfig {
    pageName: string;
    content: string;
    commitMessage?: string;
}
export interface DeleteWikiPageArgs extends WikiConfig {
    pageName: string;
    commitMessage?: string;
}
export interface ListWikiPagesArgs extends WikiConfig {
}
export interface WikiPageInfo {
    name: string;
    path: string;
    size: number;
}
/**
 * Write or update a wiki page
 */
export declare function writeWikiPage(args: WriteWikiPageArgs): Promise<{
    success: boolean;
    page: string;
    url: string;
}>;
/**
 * Append content to an existing wiki page
 */
export declare function appendToWikiPage(args: AppendToWikiPageArgs): Promise<{
    success: boolean;
    page: string;
}>;
/**
 * List all wiki pages
 */
export declare function listWikiPages(args: ListWikiPagesArgs): Promise<WikiPageInfo[]>;
/**
 * Delete a wiki page
 */
export declare function deleteWikiPage(args: DeleteWikiPageArgs): Promise<{
    success: boolean;
    page: string;
}>;
/**
 * Read a wiki page content
 */
export declare function readWikiPage(args: WriteWikiPageArgs): Promise<{
    success: boolean;
    page: string;
    content: string;
}>;
//# sourceMappingURL=wiki-operations.d.ts.map