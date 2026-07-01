from app.schemas.document import (
    AssetKind,
    BlockType,
    FigureAsset,
    FigureVersion,
    Problem,
    ProblemDocument,
    SourceImage,
    TextBlock,
)


def test_problem_document_requires_versioned_semantic_structure():
    document = ProblemDocument(
        id="doc_1",
        schema_version="1.0",
        document_version=1,
        source_image=SourceImage(
            image_id="src_1",
            filename="exercise.png",
            path="storage/uploads/exercise.png",
            width=1200,
            height=1600,
        ),
        problems=[
            Problem(
                problem_id="problem_1",
                blocks=[TextBlock(type=BlockType.PARAGRAPH, text="如图所示，求 x。")],
                figures=["fig_1"],
                confidence=0.91,
            )
        ],
        assets=[
            FigureAsset(
                figure_id="fig_1",
                source_image_id="src_1",
                bbox=[10, 20, 300, 420],
                versions=[
                    FigureVersion(
                        version_id="fig_1_original",
                        kind=AssetKind.ORIGINAL_CROP,
                        path="storage/assets/fig_1_original.png",
                        quality_score=0.82,
                    )
                ],
                selected_version="fig_1_original",
                quality_score=0.82,
                risk_level="low",
                needs_review=False,
            )
        ],
        metadata={"mode": "auto"},
    )

    payload = document.model_dump()

    assert payload["schema_version"] == "1.0"
    assert payload["document_version"] == 1
    assert payload["problems"][0]["blocks"][0]["type"] == "paragraph"
    assert payload["assets"][0]["versions"][0]["kind"] == "original_crop"


def test_blocks_receive_stable_block_ids():
    block = TextBlock(text="test")

    assert block.block_id.startswith("blk_")
    assert len(block.block_id) == 16
