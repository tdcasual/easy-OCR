from app.renderers.html import HtmlRenderer
from app.renderers.markdown import MarkdownRenderer


class RendererRegistry:
    def __init__(self):
        self._renderers = {}

    def register(self, renderer) -> None:
        self._renderers[renderer.format] = renderer

    def get(self, format_name: str):
        try:
            return self._renderers[format_name]
        except KeyError as exc:
            raise ValueError(f"unsupported export format: {format_name}") from exc

    def list_formats(self) -> list[dict[str, str]]:
        return [
            {
                "format": renderer.format,
                "mime_type": renderer.mime_type,
                "file_extension": renderer.file_extension,
            }
            for renderer in self._renderers.values()
        ]


def build_default_registry() -> RendererRegistry:
    registry = RendererRegistry()
    registry.register(MarkdownRenderer())
    registry.register(HtmlRenderer())
    return registry
