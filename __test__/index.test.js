const { processObjectToMarkdown } = require('../src/index');
const fs = require('fs');
const matter = require('gray-matter');
const slugger = require('../src/slugger');

// Mock the dependencies
jest.mock('fs');
jest.mock('../src/slugger');

describe('index.js', () => {
  // Suppress console.log during tests
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('processObjectToMarkdown', () => {
    const mockPath = '/test/path';
    const mockTitleProp = 'title';
    const mockContentProp = 'content';

    describe.only('basic functionality', () => {
      it('should create a markdown file from an object', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
          author: 'Test Author',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
        expect(slugger).toHaveBeenCalledWith('Test Title');
        expect(fs.mkdirSync).toHaveBeenCalledWith(mockPath, {
          recursive: true,
        });
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should use custom slug if provided', () => {
        const mockObj = {
          title: 'Test Title',
          slug: 'custom-slug',
          content: 'Test content',
        };

        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(slugger).not.toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          `${mockPath}/custom-slug.md`,
          expect.any(String),
        );
      });

      it('should add date if not present', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];
        expect(writtenContent).toContain('date:');
      });

      it('should not overwrite date if already present', () => {
        const existingDate = '2025-01-01T00:00:00.000Z';
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
          date: existingDate,
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];
        expect(writtenContent).toContain(existingDate);
      });

      it('should handle objects without content property', () => {
        const mockObj = {
          title: 'Test Title',
          author: 'Test Author',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          null,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
      });
    });

    describe.only('file existence handling', () => {
      it('should not overwrite if neverOverwrite is true', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          true,
        );

        expect(result).toBe(true);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
      });

      it('should merge with existing file data', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'New content',
          newField: 'New value',
        };

        const existingMarkdown = `---
title: Test Title
existingField: Existing value
date: 2025-01-01T00:00:00.000Z
---
Old content`;

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(existingMarkdown);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
        expect(fs.readFileSync).toHaveBeenCalledWith(
          `${mockPath}/test-title.md`,
          'utf8',
        );
      });

      it('should preserve existing content if longer than new content', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'New',
          newField: 'This makes data different',
        };

        const existingMarkdown = `---
title: Test Title
date: 2025-01-01T00:00:00.000Z
---
This is much longer existing content`;

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(existingMarkdown);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];
        expect(writtenContent).toContain(
          'This is much longer existing content',
        );
      });

      it('should skip writing if content and data unchanged', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Same content',
          date: '2025-01-01T00:00:00.000Z',
        };

        const existingMarkdown = `---
date: 2025-01-01T00:00:00.000Z
title: Test Title
---
Same content`;

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(existingMarkdown);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
      });

      it('should handle empty existing YAML data', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'New content',
        };

        const existingMarkdown = 'Just plain content without YAML';

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(existingMarkdown);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle file write errors', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockImplementation(() => {
          throw new Error('Write error');
        });

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(false);
      });

      it('should handle directory creation errors', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => {
          throw new Error('Mkdir error');
        });

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(false);
      });

      it('should handle file read errors gracefully', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'New content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
          throw new Error('Read error');
        });
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
      });
    });

    describe('markdown generation', () => {
      it('should generate valid YAML frontmatter', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
          author: 'John Doe',
          tags: ['test', 'example'],
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];

        expect(writtenContent).toContain('---');
        expect(writtenContent).toContain('title:');
        expect(writtenContent).toContain('author:');
      });

      it('should sort object keys alphabetically in YAML', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
          zebra: 'last',
          apple: 'first',
          middle: 'middle',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];

        const appleIndex = writtenContent.indexOf('apple:');
        const middleIndex = writtenContent.indexOf('middle:');
        const zebraIndex = writtenContent.indexOf('zebra:');

        expect(appleIndex).toBeLessThan(middleIndex);
        expect(middleIndex).toBeLessThan(zebraIndex);
      });

      it('should handle empty content gracefully', () => {
        const mockObj = {
          title: 'Test Title',
          content: '',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];
        expect(writtenContent).toContain('---');
      });
    });

    describe('content property handling', () => {
      it('should remove content property from frontmatter', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Test content',
          author: 'John Doe',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        const writeCall = fs.writeFileSync.mock.calls[0];
        const writtenContent = writeCall[1];
        const parsed = matter(writtenContent);

        expect(parsed.data.content).toBeUndefined();
        expect(parsed.content).toContain('Test content');
      });

      it('should handle null content property', () => {
        const mockObj = {
          title: 'Test Title',
          author: 'John Doe',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        const result = processObjectToMarkdown(
          mockTitleProp,
          null,
          mockPath,
          mockObj,
          false,
        );

        expect(result).toBe(true);
      });
    });

    describe('slug handling', () => {
      it('should generate slug from title when slug not provided', () => {
        const mockObj = {
          title: 'My Test Article',
          content: 'Content',
        };

        slugger.mockReturnValue('my-test-article');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(slugger).toHaveBeenCalledWith('My Test Article');
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          `${mockPath}/my-test-article.md`,
          expect.any(String),
        );
      });

      it('should not use slug if it is empty or too short', () => {
        const mockObj = {
          title: 'Test Title',
          slug: 'a',
          content: 'Content',
        };

        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(slugger).toHaveBeenCalledWith('Test Title');
      });

      it('should use provided slug when length > 1', () => {
        const mockObj = {
          title: 'Test Title',
          slug: 'my-custom-slug',
          content: 'Content',
        };

        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          mockPath,
          mockObj,
          false,
        );

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          `${mockPath}/my-custom-slug.md`,
          expect.any(String),
        );
      });
    });

    describe('path handling', () => {
      it('should create directory recursively', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Content',
        };

        const deepPath = '/test/nested/deep/path';
        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          deepPath,
          mockObj,
          false,
        );

        expect(fs.mkdirSync).toHaveBeenCalledWith(deepPath, {
          recursive: true,
        });
      });

      it('should handle paths with trailing slashes', () => {
        const mockObj = {
          title: 'Test Title',
          content: 'Content',
        };

        const pathWithSlash = '/test/path/';
        slugger.mockReturnValue('test-title');
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);

        processObjectToMarkdown(
          mockTitleProp,
          mockContentProp,
          pathWithSlash,
          mockObj,
          false,
        );

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          `${pathWithSlash}/test-title.md`,
          expect.any(String),
        );
      });
    });
  });
});
