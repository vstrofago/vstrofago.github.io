// The content: one Markdown file per project (src/content/projects/) and per outer space
// (src/content/spaces/), edited as frontmatter in any text or Markdown editor. The file
// name is the id. Templates: src/content/_templates/. Recipe: docs/assets.md.
//
// Frontmatter is flat on purpose (`title_en`, `title_es`, `x`, `y`…): editors' property panels
// edit text, numbers and checkboxes, not nested objects. Names editors reserve are avoided
// too: a project's `stack / tags` line is `stack`, since `tags` usually means a tag list.
// The schemas below check every rule (both languages, at least one link, the −20° floor…) and
// fail the build with the file and the field when one is broken, then reshape the entry for
// the components.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { statuses, fieldKeys, planetKinds, FLOOR_Y, type Planet } from './data/sky';
import { shipKinds } from './data/ships';

// An empty property (`key:` with no value) arrives as null: read it as "not set".
const text = z.string().trim().nullish().transform((v) => v || undefined);
const link = z.string().url().nullish().transform((v) => v ?? undefined);
const opt = <T extends z.ZodTypeAny>(t: T) => t.nullish().transform((v) => v ?? undefined);

/** `<key>_en` + `<key>_es` → { en, es }, or undefined when both are empty. One without the
 *  other is an error: every visible string exists in both languages. */
function pair(data: Record<string, unknown>, key: string, ctx: z.RefinementCtx): { en: string; es: string } | undefined {
  const en = data[`${key}_en`] as string | undefined;
  const es = data[`${key}_es`] as string | undefined;
  if (!en && !es) return undefined;
  if (!en || !es) {
    ctx.addIssue({ code: 'custom', path: [en ? `${key}_es` : `${key}_en`], message: `write the ${key} in both languages (${key}_en and ${key}_es) or leave both empty` });
    return undefined;
  }
  return { en, es };
}

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z
    .object({
      catalog: z.number().int().positive().describe('Catalog number: 1 → VS-001. Use the next free one; never reuse or renumber.'),
      field: z.enum(fieldKeys),
      status: z.enum(statuses),
      archive: opt(z.boolean()),
      category_en: z.string().trim().min(1),
      category_es: z.string().trim().min(1),
      title_en: text,
      title_es: text,
      description_en: text,
      description_es: text,
      stack: text,
      demo: link,
      github: link,
      more: link,
      x: opt(z.number().min(0).max(100)),
      y: opt(z.number().min(0).max(FLOOR_Y, { message: `no project below the −20° line: y ≤ ${Math.floor(FLOOR_Y * 10) / 10}` })),
      side: opt(z.enum(['left', 'right'])),
      planet: opt(z.enum(planetKinds)),
      ring: opt(z.boolean()),
      moon: opt(z.boolean()),
      tilt: opt(z.number().min(-45).max(45)),
    })
    .transform((d, ctx) => {
      const title = pair(d, 'title', ctx);
      const description = pair(d, 'description', ctx);
      const links = (['demo', 'github', 'more'] as const).flatMap((kind) => (d[kind] ? [{ kind, href: d[kind] }] : []));
      if (!links.length) ctx.addIssue({ code: 'custom', path: ['demo'], message: 'set at least one link: demo, github or more' });
      if ((d.x === undefined) !== (d.y === undefined)) {
        ctx.addIssue({ code: 'custom', path: [d.x === undefined ? 'x' : 'y'], message: 'set both x and y, or leave both empty to land near the field\'s centre' });
      }
      if (!d.planet && (d.ring || d.moon || d.tilt)) {
        ctx.addIssue({ code: 'custom', path: ['planet'], message: 'set rocky or gas to use ring, moon or tilt (empty derives the whole planet from the id)' });
      }
      const planet: Planet | undefined = d.planet && { kind: d.planet, ring: d.ring, moon: d.moon, tilt: d.tilt };
      return {
        catalog: d.catalog,
        field: d.field,
        status: d.status,
        archived: d.archive ?? false,
        category: { en: d.category_en, es: d.category_es },
        title,
        description,
        tags: d.stack,
        links,
        place: {
          ...(d.x !== undefined && d.y !== undefined ? { x: d.x, y: d.y } : {}),
          ...(d.side ? { side: d.side } : {}),
          ...(planet ? { planet } : {}),
        },
      };
    }),
});

const spaces = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/spaces' }),
  schema: z
    .object({
      order: z.number().int().positive().describe('Position in the Registro and the nav menu (CH 01…).'),
      name_en: z.string().trim().min(1),
      name_es: z.string().trim().min(1),
      handle: z.string().trim().min(1),
      url: link,
      ship: z.enum(shipKinds),
      x: z.number().min(0).max(78, { message: 'the label hangs to the right: keep x ≤ 78' }),
      y: z.number().min(0).max(100),
    })
    .transform((d) => ({
      order: d.order,
      name: { en: d.name_en, es: d.name_es },
      handle: d.handle,
      url: d.url,
      ship: d.ship,
      at: { x: d.x, y: d.y },
    })),
});

export const collections = { projects, spaces };
