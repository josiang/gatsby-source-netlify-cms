import remark from "remark";
import breaks from "remark-breaks";
import gfm from "remark-gfm";
import html from "remark-html";

export const MARKDOWN_LINK_IMAGE_REG_EXP = /\[(.*)\]\((.*?)(\s"(.*)")?\)/gm;

export const toArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const parseMarkdown = (value: string) => {
  return remark()
    .use(html)
    .use(breaks)
    .use(gfm)
    .processSync(value)
    .contents.toString();
};

export const enhanceMarkdown = <T extends unknown>(
  markdown: string,
  // eslint-disable-next-line no-unused-vars
  fileResolver: (file: string) => T | null,
  // eslint-disable-next-line no-unused-vars
  fileIdResolver: (file: T) => string
) => {
  const enhancedMarkdown = markdown.replace(
    MARKDOWN_LINK_IMAGE_REG_EXP,
    (_match, label, file, _titleSegment, title) => {
      const fileNode = fileResolver(file);

      if (fileNode) {
        return `[${label || ""}](file:${fileIdResolver(fileNode)}${
          title ? ` "${title}"` : ""
        })`;
      }

      return `[${label || ""}](${file || ""}${title ? ` "${title}"` : ""})`;
    }
  );

  return enhancedMarkdown;
};
