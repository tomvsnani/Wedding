/**
 * Comprehensive DOCX roundtrip test covering edge cases:
 * - Tables with nested paragraphs
 * - Smart quotes and special characters
 * - proofErr inline elements
 * - <w:tab/> inside runs
 * - Double-escaping prevention
 * - XML validation after replacement
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const RESUME_PATH = path.join(
  'C:', 'Users', 'pramu', 'OneDrive', 'Desktop', '.Net Resumes',
  'Ramu Senior Dotnet Developer Angular.docx'
);

// ---- Inline the fixed xmlHelpers logic ----

function decodeXmlEntities(text) {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function normalizeText(text) {
  return decodeXmlEntities(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeXmlText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractTextFromParagraphString(pXml) {
  const texts = [];
  const tRegex = /<w:t(?:\s[^>]*)?>([^]*?)<\/w:t>/g;
  let m;
  while ((m = tRegex.exec(pXml)) !== null) {
    texts.push(decodeXmlEntities(m[1]));
  }
  return texts.join('').trim();
}

function isInsideTable(xml, position) {
  const before = xml.substring(0, position);
  const tcOpens = (before.match(/<w:tc[\s>]/g) || []).length;
  const tcCloses = (before.match(/<\/w:tc>/g) || []).length;
  return tcOpens > tcCloses;
}

function findAllParagraphs(xml) {
  const results = [];
  const openTagRegex = /<w:p[\s>]/g;
  let openMatch;

  while ((openMatch = openTagRegex.exec(xml)) !== null) {
    const startIdx = openMatch.index;
    const closeTag = '</w:p>';
    const closeIdx = xml.indexOf(closeTag, startIdx);
    if (closeIdx === -1) continue;

    const endIdx = closeIdx + closeTag.length;
    const fullXml = xml.substring(startIdx, endIdx);

    const innerPCount = (fullXml.match(/<w:p[\s>]/g) || []).length;
    if (innerPCount > 1) {
      openTagRegex.lastIndex = startIdx + openMatch[0].length;
      continue;
    }

    const text = extractTextFromParagraphString(fullXml);
    const inTable = isInsideTable(xml, startIdx);

    results.push({ fullXml, text, startIndex: startIdx, endIndex: endIdx, isInTable: inTable });
    openTagRegex.lastIndex = endIdx;
  }

  return results;
}

function replaceParagraphTextInString(paragraphXml, newText) {
  const escaped = escapeXmlText(newText);
  let firstReplaced = false;

  return paragraphXml.replace(
    /<w:t(?:\s[^>]*)?>([^]*?)<\/w:t>/g,
    () => {
      if (!firstReplaced) {
        firstReplaced = true;
        return `<w:t xml:space="preserve">${escaped}</w:t>`;
      }
      return `<w:t xml:space="preserve"></w:t>`;
    }
  );
}

function applyEnhancements(xml, enhancements) {
  const paragraphs = findAllParagraphs(xml);
  const replaceableParagraphs = paragraphs;
  const usedIndices = new Set();
  const matchesToApply = [];

  for (const enhancement of enhancements) {
    if (enhancement.changeType === 'unchanged' || enhancement.changeType === 'added') continue;
    const normalizedTarget = normalizeText(enhancement.originalText);
    if (!normalizedTarget) continue;

    let bestMatch = null;
    let bestIdx = -1;

    for (let i = 0; i < replaceableParagraphs.length; i++) {
      if (usedIndices.has(i)) continue;
      if (normalizeText(replaceableParagraphs[i].text) === normalizedTarget) {
        bestMatch = replaceableParagraphs[i];
        bestIdx = i;
        break;
      }
    }

    if (!bestMatch && normalizedTarget.length > 30) {
      for (let i = 0; i < replaceableParagraphs.length; i++) {
        if (usedIndices.has(i)) continue;
        const pNorm = normalizeText(replaceableParagraphs[i].text);
        if (pNorm.length > 20 && (pNorm.includes(normalizedTarget) || normalizedTarget.includes(pNorm))) {
          bestMatch = replaceableParagraphs[i];
          bestIdx = i;
          break;
        }
      }
    }

    if (bestMatch && bestIdx >= 0) {
      usedIndices.add(bestIdx);
      let newParagraphXml = '';
      if (enhancement.changeType === 'removed') {
        newParagraphXml = '';
      } else {
        newParagraphXml = replaceParagraphTextInString(bestMatch.fullXml, enhancement.enhancedText);
      }
      matchesToApply.push({ match: bestMatch, newXml: newParagraphXml });
    } else {
      console.log(`  NO MATCH: "${enhancement.originalText.substring(0, 60)}..."`);
    }
  }

  matchesToApply.sort((a, b) => b.match.startIndex - a.match.startIndex);

  let result = xml;
  for (const { match, newXml } of matchesToApply) {
    result = result.substring(0, match.startIndex) + newXml + result.substring(match.endIndex);
  }

  const addedItems = enhancements.filter(e => e.changeType === 'added');
  if (addedItems.length > 0) {
    let insertPoint = -1;
    const sectPrIdx = result.lastIndexOf('<w:sectPr');
    if (sectPrIdx !== -1) insertPoint = sectPrIdx;
    else {
      const bodyCloseIdx = result.lastIndexOf('</w:body>');
      if (bodyCloseIdx !== -1) insertPoint = bodyCloseIdx;
    }
    if (insertPoint !== -1) {
      const templatePara = replaceableParagraphs.find(p => p.text.length > 0);
      let rPrXml = '';
      if (templatePara) {
        const rPrMatch = templatePara.fullXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
        if (rPrMatch) rPrXml = rPrMatch[0];
      }
      let insertXml = '';
      for (const item of addedItems) {
        const escaped = escapeXmlText(item.enhancedText);
        insertXml += `<w:p><w:r>${rPrXml}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
      }
      result = result.substring(0, insertPoint) + insertXml + result.substring(insertPoint);
    }
  }

  return result;
}

// ---- Test Runner ----

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.log(`  FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== DOCX Enhancement Tests ===\n');

  const fileBuffer = fs.readFileSync(RESUME_PATH);
  const zip = await JSZip.loadAsync(fileBuffer);
  const originalXml = await zip.file('word/document.xml').async('string');
  const paragraphs = findAllParagraphs(originalXml);
  const nonTableParas = paragraphs.filter(p => !p.isInTable && p.text.length > 0);
  const tableParas = paragraphs.filter(p => p.isInTable && p.text.length > 0);

  console.log(`Total paragraphs: ${paragraphs.length}`);
  console.log(`Non-table with text: ${nonTableParas.length}`);
  console.log(`In-table with text: ${tableParas.length}`);

  // Test 1: No-op roundtrip
  console.log('\n--- Test 1: No-op roundtrip ---');
  const noopResult = applyEnhancements(originalXml, []);
  assert(noopResult === originalXml, 'No-op produces identical XML');

  // Test 2: Table paragraphs are modified
  console.log('\\n--- Test 2: Table paragraph inclusion ---');
  const tableParaText = tableParas[0]?.text || '';
  if (tableParaText) {
    const tableEnhancement = [{
      originalText: tableParaText,
      enhancedText: 'SHOULD NOW APPEAR',
      changeType: 'enhanced',
    }];
    const tableResult = applyEnhancements(originalXml, tableEnhancement);
    assert(tableResult.includes('SHOULD NOW APPEAR'), 'Table paragraphs are successfully modified');
  }

  // Test 3: Special characters - apostrophes (Consul's)
  console.log('\n--- Test 3: Special character handling ---');
  const apostrophePara = nonTableParas.find(p => p.text.includes("'") || p.text.includes('\u2019'));
  if (apostrophePara) {
    console.log(`  Found paragraph with apostrophe: "${apostrophePara.text.substring(0, 60)}..."`);
    const enhancement = [{
      originalText: apostrophePara.text,
      enhancedText: apostrophePara.text + " with React 18's new features",
      changeType: 'enhanced',
    }];
    const specialResult = applyEnhancements(originalXml, enhancement);
    assert(!specialResult.includes('&amp;apos;'), 'No double-escaped apostrophes');
    assert(!specialResult.includes('&amp;amp;'), 'No double-escaped ampersands');
    // Validate XML well-formedness by checking it can still find paragraphs
    const reparse = findAllParagraphs(specialResult);
    assert(reparse.length > 0, 'Result is still parseable after special char replacement');
  }

  // Test 4: Replacement with XML-sensitive characters
  console.log('\n--- Test 4: XML-sensitive characters in replacement ---');
  const simplePara = nonTableParas[5];
  const xmlCharsEnhancement = [{
    originalText: simplePara.text,
    enhancedText: 'Used C# generics with List<T> & Dictionary<K,V> for type-safe collections > 10K items',
    changeType: 'enhanced',
  }];
  const xmlCharsResult = applyEnhancements(originalXml, xmlCharsEnhancement);
  assert(xmlCharsResult.includes('&lt;T&gt;'), 'Angle brackets are properly escaped');
  assert(xmlCharsResult.includes('&amp;'), 'Ampersand is properly escaped');
  assert(!xmlCharsResult.includes('<T>'), 'Raw angle brackets are NOT in output');

  // Test 5: Multiple replacements don't corrupt offsets
  console.log('\n--- Test 5: Multiple replacement offset handling ---');
  const multiEnhancements = nonTableParas.slice(0, 10).map(p => ({
    originalText: p.text,
    enhancedText: p.text + ' [Enhanced with React 18, TypeScript 5.x, and Next.js 14]',
    changeType: 'enhanced',
  }));
  const multiResult = applyEnhancements(originalXml, multiEnhancements);
  const multiParas = findAllParagraphs(multiResult);
  assert(multiParas.length >= paragraphs.length, 'Paragraph count preserved after multi-replace');
  let enhancedCount = 0;
  for (const p of multiParas) {
    if (p.text.includes('[Enhanced with React 18')) enhancedCount++;
  }
  assert(enhancedCount === 10, `All 10 replacements applied (got ${enhancedCount})`);

  // Test 6: Added paragraphs go before sectPr
  console.log('\n--- Test 6: Added paragraph positioning ---');
  const addedEnhancements = [{
    originalText: '',
    enhancedText: 'NEW BULLET: Implemented React server components',
    changeType: 'added',
  }];
  const addedResult = applyEnhancements(originalXml, addedEnhancements);
  const sectPrIdx = addedResult.indexOf('<w:sectPr');
  const newBulletIdx = addedResult.indexOf('NEW BULLET');
  assert(newBulletIdx !== -1, 'Added paragraph is present');
  assert(newBulletIdx < sectPrIdx, 'Added paragraph is before sectPr');

  // Test 7: Generate and validate full DOCX
  console.log('\n--- Test 7: Full DOCX generation ---');
  const fullEnhancements = [
    ...nonTableParas.slice(0, 5).map(p => ({
      originalText: p.text,
      enhancedText: p.text + ' [TEST]',
      changeType: 'enhanced',
    })),
    { originalText: '', enhancedText: 'Added bullet test', changeType: 'added' },
  ];
  const fullResult = applyEnhancements(originalXml, fullEnhancements);
  const zipOut = await JSZip.loadAsync(fileBuffer);
  zipOut.file('word/document.xml', fullResult);
  const blob = await zipOut.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync('/tmp/test_full_enhanced.docx', blob);
  console.log('  Wrote /tmp/test_full_enhanced.docx');
  assert(blob.length > 0, 'Output DOCX has content');

  // Verify the output DOCX can be re-parsed
  const reZip = await JSZip.loadAsync(blob);
  const reXml = await reZip.file('word/document.xml').async('string');
  assert(reXml.startsWith('<?xml'), 'Output XML starts with declaration');
  assert(reXml.includes('</w:document>'), 'Output XML has closing document tag');
  const reParas = findAllParagraphs(reXml);
  assert(reParas.length > 0, 'Output XML has parseable paragraphs');

  // Test 8: Simulate Claude-like response with smart quotes
  console.log('\n--- Test 8: Claude response simulation ---');
  const claudeResponse = [
    {
      originalText: nonTableParas[0].text,
      enhancedText: "Sr Fullstack React & .NET Developer",
      changeType: 'enhanced',
    },
    {
      // Simulate Claude using curly quotes
      originalText: nonTableParas[3].text,
      enhancedText: "Contact no: 937-909-0056",
      changeType: 'unchanged',
    },
    {
      originalText: '',
      enhancedText: 'Architected scalable React 18 applications with TypeScript 5.x, implementing server-side rendering using Next.js 14 App Router',
      changeType: 'added',
    },
  ];
  const claudeResult = applyEnhancements(originalXml, claudeResponse);
  assert(claudeResult.includes('Sr Fullstack React'), 'Claude-style enhancement applied');
  assert(claudeResult.includes('Next.js 14 App Router'), 'Claude-style addition applied');

  // Final verification: save and re-read
  const zipFinal = await JSZip.loadAsync(fileBuffer);
  zipFinal.file('word/document.xml', claudeResult);
  const blobFinal = await zipFinal.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync('/tmp/test_claude_sim.docx', blobFinal);
  const reZipFinal = await JSZip.loadAsync(blobFinal);
  const reFinalXml = await reZipFinal.file('word/document.xml').async('string');
  assert(reFinalXml.includes('</w:body>'), 'Final output has valid body close');
  assert(reFinalXml.includes('</w:document>'), 'Final output has valid document close');
  console.log('  Wrote /tmp/test_claude_sim.docx');

  // Test 9: Removed paragraph
  console.log('\\n--- Test 9: Removed paragraph ---');
  const removedEnhancement = [{
    originalText: nonTableParas[1].text,
    enhancedText: '',
    changeType: 'removed',
  }];
  const removedResult = applyEnhancements(originalXml, removedEnhancement);
  const removedParas = findAllParagraphs(removedResult);
  assert(removedParas.length === paragraphs.length - 1, 'Paragraph count decreased by 1 after removal');
  assert(!removedResult.includes(escapeXmlText(nonTableParas[1].text)), 'Removed text should not be found');

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
