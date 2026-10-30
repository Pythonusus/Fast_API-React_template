/**
 * Renders post body HTML from the API (TinyMCE / admin output).
 *
 * Uses the shared ``app-inner-html`` class from ``~/styles/inner-html.css``
 * so other HTML-bearing components can reuse the same prose rules.
 *
 * HTML is sanitized with nh3 on the backend before storage/serve. This
 * component does not sanitize again — do not pass unsanitized or untrusted
 * markup here.
 */

export type PostContentProps = {
  html: string | null | undefined;
  className?: string;
};

export const PostContent = ({ html, className }: PostContentProps) => {
  if (!html) {
    return null;
  }

  const classes = ["app-inner-html", className].filter(Boolean).join(" ");

  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
};
