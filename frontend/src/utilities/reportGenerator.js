import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from 'docx'
import { saveAs } from 'file-saver'

/**
 * Generate and download a Word document with crane calculation results
 * @param {Object} calculationResult - The calculation result object
 * @param {string} calculationMode - Current calculation mode ('payload' or 'safety_factor')
 * @param {Object} crane - Crane data object
 */
export const generateAndDownloadReport = async (
  calculationResult,
  calculationMode,
  crane,
) => {
  if (!calculationResult || !calculationResult.request) {
    console.error('No calculation results to export')
    return
  }

  const request = calculationResult.request || {}

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'ОТЧЕТ О РАСЧЕТЕ ГРУЗОПОДЪЕМНОСТИ КРАНА',
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Main Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // ИНФОРМАЦИЯ О КРАНЕ Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'ИНФОРМАЦИЯ О КРАНЕ',
                            bold: true,
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 80 },
                        indent: { left: 57 },
                      }),
                    ],
                    columnSpan: 2,
                  }),
                ],
              }),
              // Crane info rows
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Модель',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${crane.manufacturer} ${crane.model}`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Тип шасси',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${crane.chassis_type}`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Максимальная грузоподъемность',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${crane.max_lifting_capacity} т`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),

              // ПАРАМЕТРЫ РАСЧЕТА Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'ПАРАМЕТРЫ РАСЧЕТА',
                            bold: true,
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 80 },
                        indent: { left: 57 },
                      }),
                    ],
                    columnSpan: 2,
                  }),
                ],
              }),
              // Calculation method row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Режим расчета',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${calculationMode === 'payload' ? 'по коэффициенту запаса' : 'по заданному грузу'}`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),
              // Boom type row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Конфигурация стрелы',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${request.boom_len}`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),
              // Boom radius row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Вылет стрелы',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${request.radius} м`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),
              // Equipment weight row (conditional)
              ...(request.equipment_weight > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Вес строп. оборудования',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `${request.equipment_weight} т`,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),
              // Payload row (conditional)
              ...(typeof request.payload === 'number'
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Вес груза',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `${request.payload} т`,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),
              // Safety factor row (conditional)
              ...(typeof request.safety_factor === 'number'
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Коэффициент запаса',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `${request.safety_factor}`,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),

              // РЕЗУЛЬТАТЫ РАСЧЕТА Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'РЕЗУЛЬТАТЫ РАСЧЕТА',
                            bold: true,
                            size: 24,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 80 },
                        indent: { left: 57 },
                      }),
                    ],
                    columnSpan: 2,
                  }),
                ],
              }),
              // Lifting capacity row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Грузоподъемность на данном вылете',
                            bold: true,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${calculationResult.lifting_capacity.toFixed(2)} т`,
                            size: 22,
                          }),
                        ],
                        spacing: { before: 60, after: 60 },
                        indent: { left: 57 },
                      }),
                    ],
                  }),
                ],
              }),
              // Results based on calculation mode
              ...(calculationMode === 'payload'
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Допустимый вес груза',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: calculationResult.payload
                                    ? `${calculationResult.payload.toFixed(2)} т`
                                    : 'Н/Д',
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Коэффициент запаса',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: calculationResult.safety_factor
                                    ? calculationResult.safety_factor.toFixed(2)
                                    : 'Н/Д',
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: 'Запас грузоподъемности',
                                  bold: true,
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: request.payload
                                    ? `${(calculationResult.lifting_capacity - request.payload - (request.equipment_weight || 0)).toFixed(2)} т`
                                    : 'Н/Д',
                                  size: 22,
                                }),
                              ],
                              spacing: { before: 60, after: 60 },
                              indent: { left: 57 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]),
            ],
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: `Отчет создан: ${new Date().toLocaleString('ru-RU')}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  })

  // Generate and download
  try {
    const blob = await Packer.toBlob(doc)

    const filename = `Расчет_гп_${crane.manufacturer}_${crane.model}.docx`
    saveAs(blob, filename)
  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}
