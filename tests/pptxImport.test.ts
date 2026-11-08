import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { parsePptxPresentation } from '../src/renderer/services/pptxImportService';
import { convertDocumentPagesToSmartboardPages, ImportedDocumentPage } from '../src/renderer/services/documentImportService';
import { TextObject, ShapeObject, ImageObject } from '../src/shared/types';

describe('PowerPoint (.pptx) Import Engine & Editable Slide Objects', () => {
  let samplePptxBuffer: ArrayBuffer;

  beforeEach(async () => {
    const zip = new JSZip();

    // 1. [Content_Types].xml
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

    // 2. ppt/presentation.xml (16:9 standard EMU 12192000 x 6858000)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
  </p:sldIdLst>
</p:presentation>`);

    // 3. ppt/_rels/presentation.xml.rels
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`);

    // 4. ppt/theme/theme1.xml (Office theme colors)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="112233"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:accent1><a:srgbClr val="0284C7"/></a:accent1>
      <a:accent2><a:srgbClr val="F59E0B"/></a:accent2>
    </a:clrScheme>
  </a:themeElements>
</a:theme>`);

    // 5. ppt/media/image1.png (1x1 pixel PNG)
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    zip.file('ppt/media/image1.png', dummyPngBase64, { base64: true });

    // 6. ppt/slides/_rels/slide1.xml.rels (image relationship)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
</Relationships>`);

    // 7. ppt/slides/slide1.xml (Slide with Title text, Rectangle shape, and embedded Picture)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr/>
      <!-- Title text box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="title"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="914400" y="685800"/>
            <a:ext cx="10363200" cy="1371600"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr sz="3600" b="1">
                <a:solidFill><a:schemeClr val="accent1"/></a:solidFill>
                <a:latin typeface="Arial"/>
              </a:rPr>
              <a:t>Geography Lecture: Plate Tectonics</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Graphic Card Shape with Fill and Stroke -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="CardShape"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="1000000" y="2500000"/>
            <a:ext cx="4000000" cy="2000000"/>
          </a:xfrm>
          <a:prstGeom prst="roundRect"/>
          <a:solidFill><a:srgbClr val="E0F2FE"/></a:solidFill>
          <a:ln w="25400">
            <a:solidFill><a:srgbClr val="0284C7"/></a:solidFill>
          </a:ln>
        </p:spPr>
      </p:sp>

      <!-- Embedded Image -->
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="4" name="PlateBoundaryDiagram.png"/>
          <p:cNvPicPr/>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rImg1"/>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="6000000" y="2500000"/>
            <a:ext cx="5000000" cy="3000000"/>
          </a:xfrm>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // 8. ppt/slides/slide2.xml (Slide with bullet list & table)
    zip.file('ppt/slides/slide2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="10" name="Bullets"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="500000" y="500000"/>
            <a:ext cx="8000000" cy="4000000"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:p>
            <a:pPr lvl="0"><a:buChar char="•"/></a:pPr>
            <a:r>
              <a:rPr sz="2000"><a:solidFill><a:srgbClr val="1E293B"/></a:solidFill></a:rPr>
              <a:t>Continental Drift Hypothesis</a:t>
            </a:r>
          </a:p>
          <a:p>
            <a:pPr lvl="0"><a:buChar char="•"/></a:pPr>
            <a:r>
              <a:rPr sz="2000"><a:solidFill><a:srgbClr val="1E293B"/></a:solidFill></a:rPr>
              <a:t>Mid-Atlantic Ridge expansion</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Table -->
      <p:graphicFrame>
        <p:nvGraphicFramePr>
          <p:cNvPr id="11" name="PlateBoundaryTable"/>
          <p:cNvGraphicFramePr/>
          <p:nvPr/>
        </p:nvGraphicFramePr>
        <p:xfrm>
          <a:off x="1000000" y="4500000"/>
          <a:ext cx="6000000" cy="1800000"/>
        </p:xfrm>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tblGrid>
                <a:gridCol w="3000000"/>
                <a:gridCol w="3000000"/>
              </a:tblGrid>
              <a:tr h="900000">
                <a:tc>
                  <a:txBody><a:p><a:r><a:t>Boundary Type</a:t></a:r></a:p></a:txBody>
                </a:tc>
                <a:tc>
                  <a:txBody><a:p><a:r><a:t>Landform Created</a:t></a:r></a:p></a:txBody>
                </a:tc>
              </a:tr>
              <a:tr h="900000">
                <a:tc>
                  <a:txBody><a:p><a:r><a:t>Divergent</a:t></a:r></a:p></a:txBody>
                </a:tc>
                <a:tc>
                  <a:txBody><a:p><a:r><a:t>Rift Valley</a:t></a:r></a:p></a:txBody>
                </a:tc>
              </a:tr>
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
  </p:cSld>
</p:sld>`);

    samplePptxBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  });

  it('parses PowerPoint presentation and extracts all slides correctly', async () => {
    const progressList: number[] = [];
    const pages = await parsePptxPresentation(samplePptxBuffer, (pct) => progressList.push(pct));

    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
    expect(progressList).toContain(100);
  });

  it('extracts slide 1 objects into native SmartBoard CanvasObjects (Text, Shape, Image)', async () => {
    const pages = await parsePptxPresentation(samplePptxBuffer);
    const slide1 = pages[0];

    expect(slide1.objects).toBeDefined();
    expect(slide1.objects!.length).toBeGreaterThanOrEqual(3);

    // 1. TextObject
    const textObjs = slide1.objects!.filter((o) => o.type === 'text') as TextObject[];
    expect(textObjs.length).toBeGreaterThanOrEqual(1);
    const titleObj = textObjs.find((t) => t.content.includes('Plate Tectonics'));
    expect(titleObj).toBeDefined();
    expect(titleObj!.content).toContain('Geography Lecture: Plate Tectonics');
    expect(titleObj!.textAlign).toBe('center');
    expect(titleObj!.color).toBe('#0284c7'); // Resolved from theme accent1

    // 2. ShapeObject
    const shapeObjs = slide1.objects!.filter((o) => o.type === 'shape') as ShapeObject[];
    expect(shapeObjs.length).toBeGreaterThanOrEqual(1);
    const cardShape = shapeObjs.find((s) => s.fillColor === '#e0f2fe');
    expect(cardShape).toBeDefined();
    expect(cardShape!.shapeType).toBe('roundedRect');
    expect(cardShape!.strokeColor).toBe('#0284c7');
    expect(cardShape!.locked).toBe(false); // Modifiable in teaching mode

    // 3. ImageObject
    const imgObjs = slide1.objects!.filter((o) => o.type === 'image') as ImageObject[];
    expect(imgObjs.length).toBe(1);
    expect(imgObjs[0].dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(imgObjs[0].locked).toBe(false);
  });

  it('extracts slide 2 bullets and table structures into editable objects', async () => {
    const pages = await parsePptxPresentation(samplePptxBuffer);
    const slide2 = pages[1];

    expect(slide2.objects).toBeDefined();
    const textObjs = slide2.objects!.filter((o) => o.type === 'text') as TextObject[];

    // Verifies bullet list item extraction
    const bulletListObj = textObjs.find((t) => t.content.includes('Continental Drift Hypothesis'));
    expect(bulletListObj).toBeDefined();
    expect(bulletListObj!.content).toContain('• Continental Drift Hypothesis');
    expect(bulletListObj!.content).toContain('• Mid-Atlantic Ridge expansion');

    // Verifies table cell text extraction
    const tableHeader = textObjs.find((t) => t.content.includes('Boundary Type'));
    expect(tableHeader).toBeDefined();
    const tableCell = textObjs.find((t) => t.content.includes('Rift Valley'));
    expect(tableCell).toBeDefined();
  });

  it('converts imported slides as editable SmartBoard objects when asObjects is true', async () => {
    const pages = await parsePptxPresentation(samplePptxBuffer);
    const smartboardPages = convertDocumentPagesToSmartboardPages(pages, {
      asBackground: false,
      asObjects: true,
      titlePrefix: 'Geology_Class',
    });

    expect(smartboardPages.length).toBe(2);
    expect(smartboardPages[0].title).toBe('Geology_Class (Page 1)');
    expect(smartboardPages[0].background.type).toBe('color');
    expect(smartboardPages[0].objects.length).toBeGreaterThan(0);
    // All objects must be unlocked and modifiable during teaching mode
    expect(smartboardPages[0].objects.every((o) => o.locked === false)).toBe(true);
  });

  it('inserts imported slides as high-resolution background images when asBackground is true', async () => {
    const pages = await parsePptxPresentation(samplePptxBuffer);
    const smartboardPages = convertDocumentPagesToSmartboardPages(pages, {
      asBackground: true,
      asObjects: false,
      titlePrefix: 'Geology_Class',
    });

    expect(smartboardPages.length).toBe(2);
    expect(smartboardPages[0].background.type).toBe('image');
    expect((smartboardPages[0].background as any).imageUrl).toBeDefined();
    expect(smartboardPages[0].objects.length).toBe(0);
  });
});

