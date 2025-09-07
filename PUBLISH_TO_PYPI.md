# 🚀 Публикация FACET MCP Server на PyPI

## 📋 Предварительные требования

1. **Создайте API токен PyPI:**
   - Перейдите на https://pypi.org/manage/account/token/
   - Создайте новый API токен с областью `__token__`
   - Скопируйте токен (начинается с `pypi-`)

2. **Установите необходимые инструменты:**
   ```bash
   pip install build twine
   ```

## 🧪 Шаг 1: Тестирование на Test PyPI (рекомендуется)

Сначала опубликуйте на Test PyPI для проверки:

```bash
# Создайте файл ~/.pypirc с настройками
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

# Загрузите на Test PyPI
python3 -m twine upload --repository testpypi dist/*

# Проверьте установку
pip install --index-url https://test.pypi.org/simple/ facet-mcp-server
```

## 🚀 Шаг 2: Публикация на основном PyPI

После успешного тестирования:

```bash
# Обновите ~/.pypirc с реальным токеном PyPI
# (замените pypi-YOUR_REAL_TOKEN_HERE на ваш настоящий токен)

cat > ~/.pypirc << EOF
[distutils]
index-servers = pypi

[pypi]
username = __token__
password = pypi-YOUR_REAL_TOKEN_HERE
EOF

# Загрузите на основной PyPI
python3 -m twine upload dist/*
```

## ✅ Шаг 3: Проверка успешной публикации

```bash
# Проверьте, что пакет доступен
pip install facet-mcp-server

# Протестируйте установку
facet-mcp --help
facet-mcp tools
```

## 🎯 Результат

После успешной публикации команда `pip install facet-mcp-server` будет работать глобально! 🎉

**Проверьте:**
- https://pypi.org/project/facet-mcp-server/
- https://pypi.org/project/facet-mcp-server/0.1.0/

---

## 🔧 Команды для быстрой публикации

### Для Test PyPI:
```bash
TWINE_USERNAME=__token__ TWINE_PASSWORD=pypi-YOUR_TOKEN twine upload --repository testpypi dist/*
```

### Для основного PyPI:
```bash
TWINE_USERNAME=__token__ TWINE_PASSWORD=pypi-YOUR_TOKEN twine upload dist/*
```

### Или интерактивно:
```bash
python3 -m twine upload dist/*
# Введите: __token__
# Введите ваш токен
```
