import remark from "remark";
import breaks from "remark-breaks";
import gfm from "remark-gfm";
import html from "remark-html";

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
