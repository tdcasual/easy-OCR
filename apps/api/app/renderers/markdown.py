from app.schemas.document import (
    BlockType,
    ChoicesBlock,
    FigureRefBlock,
    FormulaBlock,
    ProblemDocument,
    TextBlock,
    UnknownBlock,
)
from app.schemas.export import ExportArtifact
from app.renderers.base import RenderContext


class MarkdownRenderer:
    format = "markdown"
    mime_type = "text/markdown"
    file_extension = "md"

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
        lines: list[str] = [f"<!-- document_version: {document.document_version} -->"]
        for problem in document.problems:
            lines.append(f"\n## {problem.problem_id}\n")
            for block in problem.blocks:
                lines.extend(self._render_block(block, context))
        return "\n".join(lines).strip() + "\n"

    def _render_block(self, block, context: RenderContext) -> list[str]:
        if isinstance(block, TextBlock):
            return [block.text, ""]
        if isinstance(block, FormulaBlock):
            return [f"$${block.latex}$$" if block.display else f"${block.latex}$", ""]
        if isinstance(block, FigureRefBlock):
            url = context.asset_resolver(block.figure_id)
            return [f"![{block.figure_id}]({url})", ""]
        if isinstance(block, ChoicesBlock):
            return [
                f"- {item.label}. " + " ".join(self._inline(child) for child in item.blocks)
                for item in block.items
            ]
        if isinstance(block, UnknownBlock):
            return [block.raw_text, ""]
        if getattr(block, "type", None) == BlockType.TABLE:
            return ["<!-- table block not yet rendered -->", ""]
        return ["<!-- unsupported block -->", ""]

    def _inline(self, block) -> str:
        if isinstance(block, TextBlock):
            return block.text
        if isinstance(block, FormulaBlock):
            return f"${block.latex}$"
        return ""
