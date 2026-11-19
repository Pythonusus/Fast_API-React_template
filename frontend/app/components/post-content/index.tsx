/**
 * Renders post body HTML from the API (TinyMCE / admin output).
 *
 * Uses the shared ``app-inner-html`` class from ``~/styles/inner-html.css``
 * so other HTML-bearing components can reuse the same prose rules. That
 * stylesheet also fits embedded S3 ``img`` / ``video`` / ``audio`` to the
 * column width.
 *
 * Markup comes from the trusted admin editor. Do not pass unsanitized or
 * untrusted HTML here.
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
