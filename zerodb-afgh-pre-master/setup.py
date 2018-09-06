from setuptools import setup, find_packages
from os.path import dirname, abspath, join

INSTALL_REQUIRES = [
    'JPype1',
    'cachetools',
    'zerodb',
    ]

setup(
    name="zerodb-afgh-pre",
    version="0.1",
    description="AFGH proxy re-encryption for ZeroDB",
    author="ZeroDB Inc.",
    author_email="michael@zerodb.io",
    license="Proprietary",
    url="http://zerodb.io",
    packages=find_packages(),
    install_requires=INSTALL_REQUIRES,
    package_dir={"": "src"},
    dependency_links=[
        join(dirname(abspath(__file__)), "deps", "zerodb.tar")]
)
