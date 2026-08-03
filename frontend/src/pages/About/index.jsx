import React from 'react'
import {
  Container,
  Header,
  Segment,
  List,
  Icon,
  Grid,
  Card,
  Button,
} from 'semantic-ui-react'

import useHistoryClear from '@/src/hooks/useHistoryClear'
import useHistoryState from '@/src/hooks/useHistoryState'
import './About.css'

const About = () => {
  const { history, setHistory } = useHistoryState()
  const { clearHistory } = useHistoryClear(history, setHistory)

  const handleClearHistory = () => {
    if (
      globalThis.confirm(
        'Вы уверены, что хотите очистить историю расчетов? Это действие нельзя отменить.',
      )
    ) {
      clearHistory()
    }
  }

  return (
    <main className='about-main'>
      <Container className='about-container'>
        <Segment raised>
          <Header as='h1' className='font-size-1'>
            Калькулятор грузоподъемности кранов
          </Header>

          <p className='about-intro-text'>
            Добро пожаловать в приложение для расчета грузоподъемности
            строительных кранов. Данная система предназначена для инженеров,
            проектировщиков и специалистов строительной отрасли, которым
            необходимо быстро и точно определить параметры работы строительного
            оборудования.
          </p>
        </Segment>

        <Grid stackable>
          <Grid.Row>
            <Grid.Column width={8}>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Icon name='search' color='blue' />
                    Поиск и фильтрация кранов
                  </Card.Header>
                  <Card.Description>
                    <List bulleted className='left-text'>
                      <List.Item>
                        Интерактивная таблица со всеми доступными кранами
                      </List.Item>
                      <List.Item>
                        Фильтрация по производителю, модели и типу шасси
                      </List.Item>
                      <List.Item>
                        Поиск по диапазону максимальной грузоподъемности
                      </List.Item>
                      <List.Item>Сортировка по различным параметрам</List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>

            <Grid.Column width={8}>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Icon name='calculator' color='violet' />
                    Расчетный модуль
                  </Card.Header>
                  <Card.Description>
                    <List bulleted className='left-text'>
                      <List.Item>
                        Два режима расчета: по заданному грузу и по коэффициенту
                        запаса
                      </List.Item>
                      <List.Item>
                        Удобный ввод исходных данных с защитой от ошибок
                      </List.Item>
                      <List.Item>
                        Автоматический расчет грузоподъемности на заданном
                        вылете
                      </List.Item>
                      <List.Item>
                        Определение коэффициента запаса и запаса
                        грузоподъемности
                      </List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column width={8}>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Icon name='download' color='orange ' />
                    Экспорт результатов
                  </Card.Header>
                  <Card.Description>
                    <List bulleted className='left-text'>
                      <List.Item>
                        Быстрое копирование результатов расчета в буфер обмена
                      </List.Item>
                      <List.Item>
                        Автоматическое формирование отчета в формате DOC
                      </List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>

            <Grid.Column width={8}>
              <Card fluid>
                <Card.Content>
                  <Card.Header>
                    <Icon name='history' color='teal' />
                    История расчетов
                  </Card.Header>
                  <Card.Description>
                    <List bulleted className='left-text'>
                      <List.Item>
                        Сохранение всех выполненных расчетов в кэше браузера
                      </List.Item>
                      <List.Item>
                        Быстрый доступ к предыдущим результатам
                      </List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row>
            <Grid.Column>
              <Card fluid>
                <Card.Content>
                  <Card.Header className='font-size-4 left-text'>
                    Примечания:
                  </Card.Header>
                  <Card.Description>
                    <List bulleted className='left-text'>
                      <List.Item>
                        Таблицы грузоподъемности, используемые в приложении,
                        взяты из технических данных кранов с официальных сайтов
                        производителей и дистрибьюторов.
                      </List.Item>
                      <List.Item>
                        В соответствии с рекомендациями технических данных,
                        окончательную грузоподъемность крана следует определять
                        по паспорту крана.
                      </List.Item>
                      <List.Item>
                        Окончательный выбор строительной техники для конкретных
                        условий всегда остается за инженером.
                      </List.Item>
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        {/* Emergency History Management Section */}
        {history.length > 0 && (
          <Segment>
            <Header as='h4' color='orange'>
              Управление историей расчетов
            </Header>
            <p className='font-size-5'>
              Если страница истории не загружается, скорее всего в нее попали
              поврежденные данные. Вы можете очистить историю расчетов здесь.
            </p>
            <Button
              color='red'
              size='mini'
              icon='trash'
              content='Очистить историю расчетов'
              onClick={handleClearHistory}
            />
          </Segment>
        )}
      </Container>
    </main>
  )
}

export default About
