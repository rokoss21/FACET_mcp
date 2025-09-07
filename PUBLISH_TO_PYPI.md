# 🚀 Publishing FACET MCP Server to PyPI

## 📋 Prerequisites

1. **Create PyPI API Token:**
   - Go to https://pypi.org/manage/account/token/
   - Create new API token with `__token__` scope
   - Copy the token (starts with `pypi-`)

2. **Install Required Tools:**
   ```bash
   pip install build twine
   ```

## 🧪 Step 1: Testing on Test PyPI (Recommended)

First publish to Test PyPI for verification:

```bash
# Create ~/.pypirc file with settings
cat > ~/.pypirc << EOF
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-YOUR_TOKEN_HERE

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR_TOKEN_HERE
EOF

# Upload to Test PyPI
python3 -m twine upload --repository testpypi dist/*

# Check installation
pip install --index-url https://test.pypi.org/simple/ facet-mcp-server
```

## 🚀 Step 2: Publishing to Main PyPI

After successful testing:

```bash
# Update ~/.pypirc with real PyPI token
# (replace pypi-YOUR_REAL_TOKEN_HERE with your actual token)

cat > ~/.pypirc << EOF
[distutils]
index-servers = pypi

[pypi]
username = __token__
password = pypi-YOUR_REAL_TOKEN_HERE
EOF

# Upload to main PyPI
python3 -m twine upload dist/*
```

## ✅ Step 3: Verification of Successful Publication

```bash
# Check that package is available
pip install facet-mcp-server

# Test installation
facet-mcp --help
facet-mcp tools
```

## 🎯 Result

After successful publication, the command `pip install facet-mcp-server` will work globally! 🎉

**Check:**
- https://pypi.org/project/facet-mcp-server/
- https://pypi.org/project/facet-mcp-server/0.1.0/

---

## 🔧 Quick Publishing Commands

### For Test PyPI:
```bash
TWINE_USERNAME=__token__ TWINE_PASSWORD=pypi-YOUR_TOKEN twine upload --repository testpypi dist/*
```

### For Main PyPI:
```bash
TWINE_USERNAME=__token__ TWINE_PASSWORD=pypi-YOUR_TOKEN twine upload dist/*
```

### Or Interactively:
```bash
python3 -m twine upload dist/*
# Enter: __token__
# Enter your token
```
