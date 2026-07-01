from app.services.storage import LocalStorage


def test_storage_writes_bytes_under_kind_directory(tmp_path):
    storage = LocalStorage(root=tmp_path)

    stored = storage.write_bytes(kind="uploads", filename="sample.png", content=b"image-bytes")

    assert stored.relative_path == "uploads/sample.png"
    assert stored.absolute_path.read_bytes() == b"image-bytes"


def test_storage_rejects_path_traversal(tmp_path):
    storage = LocalStorage(root=tmp_path)

    try:
        storage.write_bytes(kind="uploads", filename="../secret.txt", content=b"bad")
    except ValueError as exc:
        assert "unsafe filename" in str(exc)
    else:
        raise AssertionError("Expected ValueError")
