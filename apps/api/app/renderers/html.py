from html import escape

from app.schemas.document import (
    FigureRefBlock,
    FormulaBlock,
    ProblemDocument,
    TextBlock,
    UnknownBlock,
)
from app.schemas.export import ExportArtifact
from app.renderers.base import RenderContext


class HtmlRenderer:
    format = "html"
    mime_type = "text/html"
    file_extension = "html"

    def render(self, document: ProblemDocument, context: RenderContext) -> ExportArtifact:
        content = self.render_to_string(document, context)
        return ExportArtifact(
            export_id="",
            job_id="",
            document_version=document.document_version,
            format=self.format,
            mime_type=self.mime_type,
            file_extension=self.file_extension,
            path="",
            renderer_version=context.renderer_version,
            figure_mode=context.options.figure_mode,
            warnings=[],
        )

    def render_to_string(self, document: ProblemDocument, context: RenderContext) -> str:
        body: list[str] = [
            "<!doctype html>",
            "<html>",
            "<body>",
            f"<main data-document-version=\"{document.document_version}\">",
        ]
        for problem in document.problems:
            body.append(f"<article data-problem-id=\"{escape(problem.problem_id)}\">")
            for block in problem.blocks:
                body.append(self._render_block(block, context))
            body.append("</article>")
        body.extend(["</main>", "</body>", "</html>"])
        return "\n".join(body)

    def _render_block(self, block, context: RenderContext) -> str:
        if isinstance(block, TextBlock):
            return f"<p>{escape(block.text)}</p>"
        if isinstance(block, FormulaBlock):
            tag = "div" if block.display else "span"
            return f"<{tag} class=\"formula\">{escape(block.latex)}</{tag}>"
        if isinstance(block, FigureRefBlock):
            figure_id = escape(block.figure_id)
            url = escape(context.asset_resolver(block.figure_id))
            return f"<figure data-figure-id=\"{figure_id}\"><img src=\"{url}\" alt=\"{figure_id}\" /></figure>"
        if isinstance(block, UnknownBlock):
            return f"<pre>{escape(block.raw_text)}</pre>"
        return "<!-- unsupported block -->"
