export function htmlToMarkdown(html: string): string {
  let body = html;
  body = body.replace(/<!--[\s\S]*?-->/g, "");
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
  body = body.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  body = body.replace(/<head[\s\S]*?<\/head>/gi, "");

  body = body.replace(/<br\s*\/?>/gi, "\n");
  body = body.replace(/<\/(p|div|section|article|header|footer|main|aside|nav|ul|ol|li|tr|td|th|blockquote)>/gi, "\n");
  body = body.replace(/<hr\s*\/?>/gi, "\n---\n");

  for (let level = 1; level <= 6; level += 1) {
    const tag = `h${level}`;
    const prefix = "#".repeat(level);
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    body = body.replace(regex, (_match, inner: string) => `\n${prefix} ${stripTags(inner).trim()}\n`);
  }

  body = body.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, inner: string) => {
    const text = stripTags(inner).trim();
    return text ? `[${text}](${href})` : href;
  });

  body = body.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_match, _tag, inner: string) => `**${stripTags(inner)}**`);
  body = body.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_match, _tag, inner: string) => `*${stripTags(inner)}*`);
  body = body.replace(/<code>([\s\S]*?)<\/code>/gi, (_match, inner: string) => `\`${stripTags(inner)}\``);
  body = body.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_match, inner: string) => `\n\`\`\`\n${stripTags(inner)}\n\`\`\`\n`);
  body = body.replace(/<li[^>]*>([\s\S]*?)(?=<\/li>|<li|<\/ul>|<\/ol>|$)/gi, (_match, inner: string) => `- ${stripTags(inner).trim()}\n`);

  body = stripTags(body);
  body = decodeEntities(body);
  body = body.replace(/[ \t]+\n/g, "\n");
  body = body.replace(/\n{3,}/g, "\n\n");
  return body.trim();
}

function stripTags(value: string): string {
  return value.replace(/<\/?[^>]+>/g, "");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)));
}
