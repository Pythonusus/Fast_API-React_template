import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Image,
  Modal,
  Header,
  Button,
  Icon,
  Popup,
} from 'semantic-ui-react'

import './ImageGallery.css'

const ImageGallery = ({ attachments = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Filter only image attachments and sort by filename
  const imageAttachments = attachments
    .filter((attachment) => attachment.is_inline)
    .toSorted((a, b) => a.filename.localeCompare(b.filename))

  const handleImageClick = (attachment) => {
    const index = imageAttachments.findIndex((img) => img.id === attachment.id)
    setCurrentImageIndex(index)
    setSelectedImage(attachment)
    setModalOpen(true)
  }

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setSelectedImage(null)
    setCurrentImageIndex(0)
  }, [])

  const goToPrevious = useCallback(() => {
    const newIndex =
      currentImageIndex > 0
        ? currentImageIndex - 1
        : imageAttachments.length - 1
    setCurrentImageIndex(newIndex)
    //no security issues here because it is not user controlled
    // eslint-disable-next-line security/detect-object-injection
    setSelectedImage(imageAttachments[newIndex])
  }, [currentImageIndex, imageAttachments])

  const goToNext = useCallback(() => {
    const newIndex =
      currentImageIndex < imageAttachments.length - 1
        ? currentImageIndex + 1
        : 0
    setCurrentImageIndex(newIndex)
    //no security issues here because it is not user controlled
    // eslint-disable-next-line security/detect-object-injection
    setSelectedImage(imageAttachments[newIndex])
  }, [currentImageIndex, imageAttachments])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!modalOpen) return

      switch (event.key) {
        case 'ArrowLeft': {
          event.preventDefault()
          goToPrevious()
          break
        }
        case 'ArrowRight': {
          event.preventDefault()
          goToNext()
          break
        }
        case 'Escape': {
          event.preventDefault()
          handleCloseModal()
          break
        }
        default: {
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, goToNext, goToPrevious, handleCloseModal])

  if (imageAttachments.length === 0) {
    return null
  }

  return (
    <div>
      <Header
        as='h3'
        className='image-gallery-header font-size-5 center-content'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Галерея изображений
        <Icon name={isExpanded ? 'chevron up' : 'chevron down'} size='small' />
      </Header>
      {isExpanded && (
        <div className='image-gallery-container'>
          {imageAttachments.map((attachment) => (
            <div key={attachment.id} className='image-item center-content'>
              <Popup
                content={attachment.filename}
                trigger={
                  <Card
                    fluid
                    className='image-card'
                    onClick={() => handleImageClick(attachment)}
                  >
                    <Image
                      src={`/api/attachments/${attachment.id}`}
                      alt={attachment.filename}
                      className='gallery-image'
                      wrapped
                    />
                  </Card>
                }
                position='bottom center'
                size='mini'
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        size='large'
        className='image-modal'
      >
        <Modal.Content image>
          {selectedImage && (
            <div className='modal-image-container'>
              <Button
                icon
                circular
                className='nav-button prev-button'
                onClick={goToPrevious}
              >
                <Icon name='chevron left' />
              </Button>

              <Image
                src={`/api/attachments/${selectedImage.id}`}
                alt={selectedImage.filename}
                size='huge'
                centered
                className='modal-image'
              />

              <Button
                icon
                circular
                className='nav-button next-button'
                onClick={goToNext}
              >
                <Icon name='chevron right' />
              </Button>
            </div>
          )}
        </Modal.Content>
        <Modal.Actions>
          <div className='modal-actions'>
            {selectedImage && (
              <div className='image-info'>
                <strong>{selectedImage.filename}</strong>
                <div className='image-counter'>
                  {currentImageIndex + 1} из {imageAttachments.length}
                </div>
              </div>
            )}
            <button className='ui button' onClick={handleCloseModal}>
              Закрыть
            </button>
          </div>
        </Modal.Actions>
      </Modal>
    </div>
  )
}

export default ImageGallery
