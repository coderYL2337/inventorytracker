import { Modal, Box, Typography, Button, Stack, List, ListItem,IconButton } from '@mui/material';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import CloseIcon from '@mui/icons-material/Close';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const RecipeModal = ({ open, onClose, recipes, message }) => {
  console.log('Recipes:', recipes);
  const saveRecipe = async (recipe) => {
    try {
      await addDoc(collection(firestore, 'recipes'), {
        title: recipe.title, // Use the title without numbering
        prepTime: recipe.prepTime,
        ingredients: recipe.ingredients,
        preparation: recipe.preparation,
      });
      console.log('Recipe saved successfully');
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
      <IconButton
  aria-label="close"
  onClick={onClose}
  sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
    >
      <CloseIcon />
    </IconButton>
        <Typography variant="h4" gutterBottom>
          Recipe Recommendations
        </Typography>
        <List>
          {Array.isArray(recipes) && recipes.map((recipe, index) => (
            <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 4 }}>
              <Typography variant="h5" >{recipe.title}</Typography>
              <Typography variant="subtitle1">Prep Time: {recipe.prepTime}</Typography>
              <Typography variant="h6" mt={2}>Ingredients:</Typography>
              <ul>
                {recipe.ingredients.map((ingredient, i) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
              <Typography variant="h6" mt={2}>Preparation:</Typography>
              <ol>
                {recipe.preparation.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <Button variant="contained" onClick={() => saveRecipe(recipe)} sx={{ mt: 2 }}>
                Save Recipe
              </Button>
            </ListItem>
          ))}
        </List>
        {message && (
          <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
            {message}
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default RecipeModal;






