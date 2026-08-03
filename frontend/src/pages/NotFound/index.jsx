import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Header, Icon, Message } from 'semantic-ui-react'

import './NotFound.css'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Container className='not-found-container center-content'>
      <div className='not-found-content'>
        <div className='error-illustration'>
          <Icon name='exclamation triangle' size='massive' color='orange' />
        </div>

        <Header as='h1' className='error-title'>
          404
        </Header>

        <Header as='h2' className='error-subtitle'>
          Страница не найдена
        </Header>

        <Message className='error-message'>
          <p>
            Упс! Страница, которую вы ищете, не существует. Возможно, она была
            перемещена, удалена, или вы ввели неправильный URL.
          </p>
        </Message>

        <div className='action-buttons'>
          <Button
            primary
            size='large'
            icon='home'
            content='На главную'
            onClick={() => navigate('/')}
          />
          <Button
            secondary
            size='large'
            icon='arrow left'
            content='Назад'
            onClick={() => navigate(-1)}
          />
        </div>

        <div className='helpful-links'>
          <p>Возможно, вас также заинтересует:</p>
          <div className='link-buttons'>
            <Button
              basic
              size='small'
              content='Таблица сравнения'
              onClick={() => navigate('/compare')}
            />
            <Button
              basic
              size='small'
              content='История расчетов'
              onClick={() => navigate('/history')}
            />
            <Button
              basic
              size='small'
              content='О программе'
              onClick={() => navigate('/about')}
            />
          </div>
        </div>
      </div>
    </Container>
  )
}

export default NotFound
