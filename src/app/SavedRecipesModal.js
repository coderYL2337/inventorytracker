import React, { useState } from 'react';
import { Modal, Box, Typography, Button, List, ListItem, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 2,
};

const SavedRecipesModal = ({ open, onClose, recipes, onUpdate }) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleDelete = async (id) => {
    await deleteDoc(doc(firestore, 'recipes', id));
    onUpdate();
  };

  const recipeDetailView = (
    <Box sx={{ textAlign: 'left', pl: 2 }}>
      <Typography variant="h5" gutterBottom>{selectedRecipe?.title}</Typography>
      <Typography>Prep Time: {selectedRecipe?.prepTime}</Typography>
      <Typography variant="h6" mt={2}>Ingredients:</Typography>
      <ul>
        {selectedRecipe?.ingredients.map((ingredient, index) => (
          <li key={index}>{ingredient}</li>
        ))}
      </ul>
      <Typography variant="h6" mt={2}>Preparation:</Typography>
      <ol>
        {selectedRecipe?.preparation.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <Button onClick={() => setSelectedRecipe(null)} sx={{ mt: 2 }}>Back to List</Button>
    </Box>
  );

  const recipeListView = (
    <>
      <Typography variant="h4" gutterBottom>Saved Recipes</Typography>
      <List>
        {recipes.map((recipe) => (
          <ListItem key={recipe.id} sx={{ justifyContent: 'space-between' }}>
            <Typography 
              onClick={() => setSelectedRecipe(recipe)} 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {recipe.title}
            </Typography>
            <Button onClick={() => handleDelete(recipe.id)} color="error">Delete</Button>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
        {selectedRecipe ? recipeDetailView : recipeListView}
        <Button onClick={onClose} sx={{ mt: 2 }}>Go Back Home</Button>
      </Box>
    </Modal>
  );
};

export default SavedRecipesModal;