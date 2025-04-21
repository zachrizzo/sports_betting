from setuptools import setup, find_packages

setup(
    name="sports-intel",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "typer",
        "playwright",
    ],
    entry_points={
        "console_scripts": [
            "sports-intel=sports_intel.cli_simple:app",
        ],
    },
)
