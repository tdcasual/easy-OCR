from typing import Callable, Protocol

from app.schemas.document import ProblemDocument
from app.schemas.export import ExportArtifact, ExportOptions


AssetResolver = Callable[[str], str]


class RenderContext:
    def __init__(
        self,
        options: ExportOptions,
        asset_resolver: AssetResolver,
        renderer_version: str = "0.1.0",
    ):
        self.options = options
        self.asset_resolver = asset_resolver
        self.renderer_version = renderer_version


class Renderer(Protocol):
    format: str
    mime_type: str
    file_extension: str

    def render(self, document: ProblemDocument, context: RenderContext) -> ExportArtifact:
        ...

    def render_to_string(self, document: ProblemDocument, context: RenderContext) -> str:
        ...
