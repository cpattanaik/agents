import { simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
/**
 * Normalize page name to filename
 * Example: "Architettura del Sistema" -> "Architettura-del-Sistema.md"
 */
function normalizePageName(pageName) {
    const normalized = pageName
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-_]/g, '');
    return normalized.endsWith('.md') ? normalized : `${normalized}.md`;
}
/**
 * Create authenticated wiki URL
 */
function getWikiUrl(owner, repo, token) {
    return `https://${token}@github.com/${owner}/${repo}.wiki.git`;
}
/**
 * Clone wiki repository to temporary directory
 */
async function cloneWiki(config) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-'));
    const wikiUrl = getWikiUrl(config.owner, config.repo, config.token);
    const git = simpleGit();
    try {
        await git.clone(wikiUrl, tmpDir);
        return { tmpDir, git: simpleGit(tmpDir) };
    }
    catch (error) {
        // Clean up on error
        await fs.rm(tmpDir, { recursive: true, force: true });
        throw new Error(`Failed to clone wiki: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Clean up temporary directory
 */
async function cleanup(tmpDir) {
    try {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
    catch (error) {
        console.error(`Warning: Failed to cleanup ${tmpDir}:`, error);
    }
}
/**
 * Write or update a wiki page
 */
export async function writeWikiPage(args) {
    const { owner, repo, token, pageName, content, commitMessage } = args;
    const fileName = normalizePageName(pageName);
    let tmpDir = null;
    try {
        const { tmpDir: dir, git } = await cloneWiki({ owner, repo, token });
        tmpDir = dir;
        const filePath = path.join(tmpDir, fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        await git.add(fileName);
        await git.commit(commitMessage || `Update ${fileName}`);
        await git.push('origin', 'master');
        const wikiPageUrl = `https://github.com/${owner}/${repo}/wiki/${fileName.replace('.md', '')}`;
        return {
            success: true,
            page: fileName,
            url: wikiPageUrl
        };
    }
    finally {
        if (tmpDir) {
            await cleanup(tmpDir);
        }
    }
}
/**
 * Append content to an existing wiki page
 */
export async function appendToWikiPage(args) {
    const { owner, repo, token, pageName, content, commitMessage } = args;
    const fileName = normalizePageName(pageName);
    let tmpDir = null;
    try {
        const { tmpDir: dir, git } = await cloneWiki({ owner, repo, token });
        tmpDir = dir;
        const filePath = path.join(tmpDir, fileName);
        // Read existing content if file exists
        let existingContent = '';
        try {
            existingContent = await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            // File doesn't exist, start with empty content
        }
        // Append new content with a newline separator
        const newContent = existingContent
            ? `${existingContent}\n\n${content}`
            : content;
        await fs.writeFile(filePath, newContent, 'utf-8');
        await git.add(fileName);
        await git.commit(commitMessage || `Append to ${fileName}`);
        await git.push('origin', 'master');
        return {
            success: true,
            page: fileName
        };
    }
    finally {
        if (tmpDir) {
            await cleanup(tmpDir);
        }
    }
}
/**
 * List all wiki pages
 */
export async function listWikiPages(args) {
    const { owner, repo, token } = args;
    let tmpDir = null;
    try {
        const { tmpDir: dir } = await cloneWiki({ owner, repo, token });
        tmpDir = dir;
        const files = await fs.readdir(tmpDir);
        const mdFiles = files.filter((f) => f.endsWith('.md'));
        const pageInfos = [];
        for (const file of mdFiles) {
            const filePath = path.join(tmpDir, file);
            const stats = await fs.stat(filePath);
            pageInfos.push({
                name: file.replace('.md', ''),
                path: file,
                size: stats.size
            });
        }
        return pageInfos.sort((a, b) => a.name.localeCompare(b.name));
    }
    finally {
        if (tmpDir) {
            await cleanup(tmpDir);
        }
    }
}
/**
 * Delete a wiki page
 */
export async function deleteWikiPage(args) {
    const { owner, repo, token, pageName, commitMessage } = args;
    const fileName = normalizePageName(pageName);
    let tmpDir = null;
    try {
        const { tmpDir: dir, git } = await cloneWiki({ owner, repo, token });
        tmpDir = dir;
        const filePath = path.join(tmpDir, fileName);
        // Check if file exists
        try {
            await fs.access(filePath);
        }
        catch (error) {
            throw new Error(`Page ${fileName} does not exist`);
        }
        await fs.unlink(filePath);
        await git.add(fileName);
        await git.commit(commitMessage || `Delete ${fileName}`);
        await git.push('origin', 'master');
        return {
            success: true,
            page: fileName
        };
    }
    finally {
        if (tmpDir) {
            await cleanup(tmpDir);
        }
    }
}
/**
 * Read a wiki page content
 */
export async function readWikiPage(args) {
    const { owner, repo, token, pageName } = args;
    const fileName = normalizePageName(pageName);
    let tmpDir = null;
    try {
        const { tmpDir: dir } = await cloneWiki({ owner, repo, token });
        tmpDir = dir;
        const filePath = path.join(tmpDir, fileName);
        // Check if file exists
        try {
            await fs.access(filePath);
        }
        catch (error) {
            throw new Error(`Page ${fileName} does not exist`);
        }
        const content = await fs.readFile(filePath, 'utf-8');
        return {
            success: true,
            page: fileName,
            content
        };
    }
    finally {
        if (tmpDir) {
            await cleanup(tmpDir);
        }
    }
}
//# sourceMappingURL=wiki-operations.js.map