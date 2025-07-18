/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { parse } from '../../parser';
import { BasicPrettyPrinter } from '../basic_pretty_printer';

const reprint = (src: string) => {
  const { root } = parse(src, { withFormatting: true });
  const text = BasicPrettyPrinter.print(root);

  // console.log(JSON.stringify(root.commands, null, 2));

  return { text };
};

const assertPrint = (src: string, expected: string = src) => {
  const { text } = reprint(src);

  expect(text).toBe(expected);
};

describe('source expression', () => {
  test('can print source left comment', () => {
    assertPrint('FROM /* cmt */ expr');
  });

  test('can print source right comment', () => {
    assertPrint('FROM expr /* cmt */');
  });

  test('can print source right comment with comma separating from next source', () => {
    assertPrint('FROM expr /* cmt */, expr2');
  });

  test('can print source left and right comments', () => {
    assertPrint(
      'FROM /*a*/ /* b */ index1 /* c */, /* d */ index2 /* e */ /* f */, /* g */ index3'
    );
  });
});

describe('source column expression', () => {
  test('can print source left comment', () => {
    assertPrint('FROM a | STATS /* cmt */ col');
  });

  test('can print column right comment', () => {
    assertPrint('FROM a | STATS col /* cmt */');
  });

  test('can print column left and right comments', () => {
    assertPrint(
      'FROM a | STATS /*a*/ /* b */ col /* c */ /* d */, /* e */ col2 /* f */, col3 /* comment3 */, col4'
    );
  });
});

describe('literal expression', () => {
  test('can print source left comment', () => {
    assertPrint('FROM a | STATS /* cmt */ 1');
  });

  test('can print column right comment', () => {
    assertPrint('FROM a | STATS "str" /* cmt */');
  });

  test('can print column left and right comments', () => {
    assertPrint(
      'FROM a | STATS /*a*/ /* b */ TRUE /* c */ /* d */, /* e */ 1.1 /* f */, FALSE /* comment3 */, NULL'
    );
  });
});

describe('time interval expression', () => {
  test('can print source left comment', () => {
    assertPrint('FROM a | STATS /* cmt */ 1d');
  });

  test('can print column right comment', () => {
    assertPrint('FROM a | STATS 2 years /* cmt */');
  });

  test('can print column left and right comments', () => {
    assertPrint(
      'FROM a | STATS /*a*/ /* b */ 2 years /* c */ /* d */, /* e */ 3d /* f */, 1 week /* comment3 */, 1 weeks'
    );
  });
});

describe('inline cast expression', () => {
  test('can print source left comment', () => {
    assertPrint('FROM a | STATS /* 1 */ /* 2 */ 123::INTEGER /* 3 */');
  });
});

describe('list expressions', () => {
  describe('literal list', () => {
    test('can print source left comment', () => {
      assertPrint('FROM a | STATS /* 1 */ /* 2 */ [1, 2, 3] /* 3 */');
    });
  });

  describe('tuple list', () => {
    test('can print comments around the tuple', () => {
      assertPrint('FROM a | WHERE b IN /* 1 */ /* 2 */ (1, 2, 3) /* 3 */');
      assertPrint('FROM a | WHERE b NOT IN /* 1 */ /* 2 */ (1, 2, 3) /* 3 */');
    });

    test('can print comments inside the tuple', () => {
      assertPrint('FROM a | WHERE b IN (/* 1 */ 1 /* 2 */, /* 3 */ 2 /* 4 */, /* 5 */ 3 /* 6 */)');
      assertPrint(
        'FROM a | WHERE b NOT IN (/* 1 */ 1 /* 2 */, /* 3 */ 2 /* 4 */, /* 5 */ 3 /* 6 */)'
      );
      assertPrint(
        'FROM a | WHERE b IN /* 0 */ (/* 1 */ 1 /* 2 */, /* 3 */ 2 /* 4 */, /* 5 */ 3 /* 6 */) /* 7 */'
      );
    });
  });
});

describe('function call expressions', () => {
  test('left of function call', () => {
    assertPrint('FROM a | STATS /* 1 */ FN()');
  });

  test('right of function call', () => {
    assertPrint('FROM a | STATS FN() /* asdf */');
  });

  test('various sides from function calls', () => {
    assertPrint('FROM a | STATS FN() /* asdf */, /*1*/ FN2() /*2*/, FN3() /*3*/');
  });

  test('left of function call, when function as an argument', () => {
    assertPrint('FROM a | STATS /* 1 */ FN(1)');
  });

  test('right comments respect function bracket', () => {
    assertPrint('FROM a | STATS FN(1 /* 1 */) /* 2 */');
  });

  test('around function argument', () => {
    assertPrint('FROM a | STATS /*1*/ FN(/*2*/ 1 /*3*/) /*4*/');
  });

  test('around function arguments', () => {
    assertPrint('FROM a | STATS /*1*/ FN(/*2*/ 1 /*3*/, /*4*/ /*5*/ 2 /*6*/ /*7*/) /*8*/');
  });
});

describe('map expression', () => {
  test('comments around map', () => {
    assertPrint('ROW F(0, /*1*/ {"a": 1} /*2*/)');
  });

  test('comments around map key', () => {
    assertPrint('ROW F(0, {/*1*/ "a" /*2*/: 1})');
  });

  test('comments around map value', () => {
    assertPrint('ROW F(0, {"a": /*1*/ 1 /*2*/})');
  });

  test('comments around multiple map fields', () => {
    assertPrint('ROW F(0, /*1*/ {/*2*/ "a": /*3*/ "b" /*4*/, /*5*/ "c": /*6*/ "d" /*7*/} /*8*/)');
  });
});

describe('binary expressions', () => {
  test('around binary expression operands', () => {
    assertPrint('FROM a | STATS /* a */ 1 /* b */ + /* c */ 2 /* d */');
  });

  test('around binary expression operands, twice', () => {
    assertPrint('FROM a | STATS /* a */ 1 /* b */ + /* c */ 2 /* d */ + /* e */ 3 /* f */');
  });

  test('around binary expression operands, trice', () => {
    assertPrint(
      'FROM a | STATS /* a */ /* a.2 */ 1 /* b */ + /* c */ 2 /* d */ + /* e */ 3 /* f */ + /* g */ 4 /* h */ /* h.2 */'
    );
  });

  describe('grouping', () => {
    test('AND has higher precedence than OR', () => {
      assertPrint('FROM a | WHERE /* a */ b /* b */ AND (c /* d */ OR /* e */ d)');
      assertPrint('FROM a | WHERE (b /* a */ OR /* b */ c) AND /* c */ d');
    });

    test('addition has higher precedence than AND', () => {
      assertPrint('FROM a | WHERE b /* a */ + (/* b */ c /* c */ AND /* d */ d /* e */)');
      assertPrint('FROM a | WHERE (/* a */ b /* b */ AND /* c */ c /* d */) + /* e */ d /* f */');
    });

    test('multiplication (division) has higher precedence than addition (subtraction)', () => {
      assertPrint(
        'FROM a | WHERE /* a */ b /* b */ / (/* c */ c /* d */ - /* e */ d /* f */) /* h */'
      );
      assertPrint('FROM a | WHERE (/* a */ b /* b */ - /* c */ c /* d */) / /* e */ d /* f */');
    });

    test('issue: https://github.com/elastic/kibana/issues/224990', () => {
      assertPrint('FROM a | WHERE b AND (c OR d)');
      assertPrint(
        'FROM kibana_sample_data_logs | WHERE agent.keyword /* a */ == /* b */ "meow" AND (geo.dest == "GR" /* c */ OR geo.dest == "ES")'
      );
    });
  });
});

describe('unary expressions', () => {
  test('around binary expression operands', () => {
    assertPrint('FROM a | STATS /* a */ NOT /* b */ 1 /* c */');
  });

  test('around binary expression operands, with trailing argument', () => {
    assertPrint('FROM a | STATS /* a */ NOT /* b */ 1 /* c */, 2');
  });
});

describe('post-fix unary expressions', () => {
  test('around binary expression operands', () => {
    assertPrint('FROM a | STATS /*I*/ 0 /*II*/ IS NULL /*III*/');
  });

  test('around binary expression operands, with surrounding args', () => {
    assertPrint('FROM a | STATS FN(1, /*I*/ 0 /*II*/ IS NULL /*III*/, 2)');
  });
});

describe('rename expressions', () => {
  test('around the rename expression', () => {
    assertPrint('FROM a | RENAME /*I*/ a AS b /*II*/');
  });

  test('around two rename expressions', () => {
    assertPrint('FROM a | RENAME /*I*/ a AS b /*II*/, /*III*/ c AS d /*IV*/');
  });

  test('inside rename expression', () => {
    assertPrint('FROM a | RENAME /*I*/ a /*II*/ AS /*III*/ b /*IV*/, c AS d');
  });
});

describe('commands', () => {
  describe('JOIN', () => {
    test('around JOIN targets', () => {
      assertPrint('FROM a | LEFT JOIN /*1*/ a /*2*/ /*3*/ /*4*/');
    });

    test('around JOIN conditions', () => {
      assertPrint('FROM a | LEFT JOIN a /*1*/ /*2*/ /*3*/ /*4*/');
    });
  });

  /**
   * @todo Tests skipped, while RERANK command grammar is being stabilized. We will
   * get back to it after 9.1 release.
   */
  describe.skip('RERANK', () => {
    test('comments around all elements', () => {
      assertPrint(
        'FROM a | /*0*/ RERANK /*1*/ "query" /*2*/ ON /*3*/ field /*4*/ WITH /*5*/ id /*6*/'
      );
    });

    test('comments around all elements, two fields', () => {
      assertPrint(
        'FROM a | /*0*/ RERANK /*1*/ "query" /*2*/ ON /*3*/ field1 /*4*/, /*5*/ field2 /*6*/ WITH /*7*/ id1 /*8*/'
      );
    });
  });
});
