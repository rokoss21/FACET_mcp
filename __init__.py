"""
FACET MCP Server - Agent-First AI Tooling

A revolutionary MCP server that transforms AI agents from "creative but unreliable assistants"
into "high-performance managers" who delegate precise tasks to specialized tools.
"""

from .facet_mcp import FACETMCPServer, MCPTool
from .facet_mcp.protocol.transport import MCPClient

__version__ = "0.1.0"
__author__ = "Emil Rokossovskiy"
__description__ = "FACET MCP Server - Agent-First AI Tooling"

__all__ = [
    "FACETMCPServer",
    "MCPTool",
    "MCPClient",
    "__version__",
    "__author__",
    "__description__"
]
