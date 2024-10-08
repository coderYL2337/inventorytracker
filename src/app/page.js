'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Camera } from 'react-camera-pro';
import {
  Box, Stack, Typography, Button, Modal, TextField,
  Snackbar, Alert, Container, List, ListItem, Avatar, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { firestore } from '../firebase';
import RobotIcon from '@mui/icons-material/SmartToy';
import RecipeModal from './RecipeModal';
import {
  collection, addDoc, doc, getDocs, query, where, updateDoc, deleteDoc
} from 'firebase/firestore';
import SavedRecipesModal from './SavedRecipesModal';
import { useAuth, ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'; // Clerk Auth
import { Toaster, toast } from 'react-hot-toast';
import './globals.css';

const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const { isSignedIn, userId } = useAuth(); // Clerk Auth
  const router = useRouter();

  // State management
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [image, setImage] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnit, setItemUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [notFoundItem, setNotFoundItem] = useState('');
  // const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  // const [waitlistEmail, setWaitlistEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedRecipeModalOpen, setSavedRecipeModalOpen] = useState(false);


  // Utility function to check authentication and show toast
  const checkAuth = () => {
    if (!isSignedIn) {
      toast.error("Please sign in to use this feature.");
      router.push('/sign-in');
      return false;
    }
    return true;
  };

  // Fetch recipes based on inventory items
  const fetchRecipes = async () => {
    if (!checkAuth()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/get-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory }),
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setRecipeModalOpen(true);
      } else {
        console.error('Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch saved recipes for the logged-in user
  const fetchSavedRecipes = async () => {
    if (!checkAuth()) return;

    const snapshot = await getDocs(collection(firestore, 'users', userId, 'recipes'));
    const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSavedRecipes(recipes);
    setSavedRecipeModalOpen(true);
  };

  // Handle taking a photo
  const handleTakePhoto = async () => {
    if (!checkAuth()) return;

    if (cameraRef.current) {
      const screenshot = cameraRef.current.takePhoto();
      if (screenshot) {
        try {
          const response = await fetch('/api/interpret-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ photo: screenshot.split(',')[1] }), // Send base64 content
          });
          if (response.ok) {
            const data = await response.json();
            setItemName(data.itemName);
            setItemModalOpen(true);
            setCameraOpen(false);
          } else {
            console.error('Failed to interpret image');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  };

  // Update inventory items for the logged-in user
  const updateInventory = async () => {
    if (!checkAuth()) return;

    try {
      const snapshot = await getDocs(query(collection(firestore, 'users', userId, 'inventory')));
      const inventoryList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || doc.id,
          quantity: data.quantity,
          unit: data.unit,
        };
      });
      inventoryList.sort((a, b) => a.name.localeCompare(b.name));
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  // Add an item to the inventory
  const addItem = async (item, quantity, unit) => {
    if (!checkAuth()) return;
    // if (itemName=='' || itemName==null) {
    //   toast.error("Please enter an item name.");
    //   return;
    // }
    if (!itemName.trim()) {
      toast.error("Please enter an item name.");
      return;
    }

    const q = query(collection(firestore, 'users', userId, 'inventory'), where("name", "==", item));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        quantity: existingDoc.data().quantity + quantity,
        unit: unit,
      });
    } else {
      await addDoc(collection(firestore, 'users', userId, 'inventory'), {
        name: item,
        quantity: quantity,
        unit: unit,
      });
    }
    setSuccessSnackbarOpen({ open: true, itemName: item });
    await updateInventory();
  };

  // Remove an item from the inventory
  const removeItem = async (id) => {
    if (!checkAuth()) return;

    const docRef = doc(collection(firestore, 'users', userId, 'inventory'), id);
    await deleteDoc(docRef);
    await updateInventory();
  };

  // Update the quantity of an inventory item
  const updateQuantity = async (id, newQuantity) => {
    if (!checkAuth()) return;

    const docRef = doc(collection(firestore, 'users', userId, 'inventory'), id);
    await updateDoc(docRef, { quantity: newQuantity });
    await updateInventory();
  };

  const handleQuantityChange = (id, newQuantity) => {
    setInventory(prevInventory =>
      prevInventory.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  

  useEffect(() => {
    if (isSignedIn) {
      updateInventory();
    }
  }, [isSignedIn]);

  // Handle item modal open and close
  const handleItemModalClose = () => setItemModalOpen(false);

  // Handle search functionality
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    if (term) {
      const matchingItem = inventory.find(item =>
        item.name.toLowerCase().includes(term)
      );

      if (matchingItem) {
        const element = document.getElementById(`inventory-item-${matchingItem.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setNotFoundItem('');
      } else {
        setNotFoundItem(term);
        setSnackbarOpen(true);
      }
    } else {
      setNotFoundItem('');
    }
  };


  // const handleOpenWaitlistModal = () => {
  //   setWaitlistModalOpen(true);
  //   setWaitlistEmail('');
  //   setEmailError('');
  //   setSuccessMessage('');
  // };

  // const handleCloseWaitlistModal = () => {
  //   setWaitlistModalOpen(false);
  //   setWaitlistEmail('');
  //   setEmailError('');
  //   setSuccessMessage('');
  // };

  // const handleAddToWaitlist = async () => {
  //   setEmailError('');
  //   setSuccessMessage('');

  //   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail);
  //   if (!isValidEmail) {
  //     setEmailError('Please enter a valid email address.');
  //     return;
  //   }

  //   try {
  //     await addDoc(collection(firestore, 'waitlist'), { email: waitlistEmail });
  //     setSuccessMessage('Thank you for joining the waitlist!');
  //     setWaitlistEmail('');
  //   } catch (error) {
  //     console.error("Error adding to waitlist:", error);
  //     setEmailError('An error occurred. Please try again later.');
  //   }
  // };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'rgba(0,0,0,0.1)' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Box sx={{
        position: 'relative',
        bgcolor: '#E0E0E0',
        p: 2,
        mb: 2,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {isLoading && (
          <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: 'white' }}>AI generating recipes...</Typography>
          </Box>
        )}
        
        <Avatar
          src="/pantrylist.png"
          alt="Pantry List Logo"
          sx={{ width: 50, height: 50 }}
        />
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontFamily: 'Pacifico, cursive',
            color: '#FF6B6B',
            flexGrow: 1,
            textAlign: 'center'
          }}
        >
          Inventory Tracker
        </Typography>

        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="contained" color="primary" size="large">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      
        {/* <Button variant="contained" color="primary" onClick={handleOpenWaitlistModal}>
          Join wait List
        </Button> */}
        {/* <Modal open={waitlistModalOpen} onClose={handleCloseWaitlistModal}>
          <Box sx={style}>
            <Typography variant="h6" component="h2">
              Join the Waitlist. We&apos;ll notify you when the app is ready!
            </Typography>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              value={waitlistEmail}
              onChange={(e) => {
                setWaitlistEmail(e.target.value);
                setEmailError('');
              }}
              error={!!emailError}
              helperText={emailError}
            />
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToWaitlist}
              disabled={!waitlistEmail || !!emailError}
            >
              Join Waitlist
            </Button>
          </Box>
        </Modal> */}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={() => setCameraOpen(true)}
          startIcon={<CameraAltIcon />} 
        >
          Take Photo
        </Button>
        <Modal open={cameraOpen} onClose={() => setCameraOpen(false)}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Camera ref={cameraRef} aspectRatio={4 / 3} numberOfCamerasCallback={setNumberOfCameras} />
            <Button
              onClick={handleTakePhoto}
              sx={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '50%',
                padding: '10px',
              }}
            >
              <CameraAltIcon fontSize="large" />
            </Button>
            {numberOfCameras > 1 && (
              <Button
                onClick={() => cameraRef.current.switchCamera()}
                sx={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  padding: '10px',
                }}
              >
                Switch Camera
              </Button>
            )}
            <Button
              onClick={() => setCameraOpen(false)}
              sx={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '10px',
              }}
            >
              Go Back to Home
            </Button>
          </Box>
        </Modal>
        <Modal
          open={itemModalOpen}
          onClose={handleItemModalClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            <Stack width="100%" direction={'column'} spacing={2}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                label="Quantity"
                variant="outlined"
                type="number"
                fullWidth
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
              />
              <TextField
                label="Unit"
                variant="outlined"
                fullWidth
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => {
                  addItem(itemName, itemQuantity, itemUnit);
                  setItemName('');
                  setItemQuantity(1);
                  setItemUnit('');
                  handleItemModalClose();
                }}
              >
                Add
              </Button>
              <Button variant="outlined" onClick={handleItemModalClose}>
                Cancel
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Snackbar
          open={successSnackbarOpen.open}
          autoHideDuration={6000}
          onClose={() => setSuccessSnackbarOpen({ open: false, itemName: '' })}
        >
          <Alert onClose={() => setSuccessSnackbarOpen({ open: false, itemName: '' })} severity="success">
            {successSnackbarOpen.itemName} added successfully!
          </Alert>
        </Snackbar>
        <Button variant="contained" onClick={handleOpen}
          sx={{ 
            borderRadius: 20, 
            backgroundColor: '#FFD166', 
            color: '#000', 
            '&:hover': { backgroundColor: '#FFC233' }
          }}>
          + New Item
        </Button>
        <Button variant="contained" onClick={updateInventory} 
          sx={{ 
            borderRadius: 20, 
            backgroundColor: '#06D6A0', 
            color: '#000', 
            '&:hover': { backgroundColor: '#05B384' }
          }}>
          ↻ Update
        </Button>
        <Button 
          variant="contained" 
          onClick={fetchRecipes}
          startIcon={<RobotIcon />} 
        >
          Recipe Generator
        </Button>
        <Button variant="contained" onClick={fetchSavedRecipes}>
          Saved Recipes
        </Button>

        <TextField
          label="Search"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 250 }}
        />
      </Box>

      <Box sx={{ width: '100%', maxWidth: 800, margin: 'auto', bgcolor: '#FFF3E0' }}>
        <Typography variant="h4" sx={{ bgcolor: '#FFB74D', p: 2, textAlign: 'center', color: '#FFF' }}>
          Inventory Items
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {inventory.map(({ id, name, quantity, unit }) => (
            <ListItem
              key={id}
              id={`inventory-item-${id}`}
              sx={{ 
                bgcolor: '#FFECB3', 
                mb: 1, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 2
              }}
            >
              <Typography variant="h6">{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = Number(e.target.value);
                    updateQuantity(id, newQuantity);
                    handleQuantityChange(id, newQuantity);
                  }}
                  sx={{ 
                    width: 100,
                    minWidth: 80,
                    mr: 1,
                    '& input': {
                      textAlign: 'left',
                      paddingRight: '8px'
                    }
                  }}
                  InputProps={{
                    inputProps: { 
                      min: 0, 
                      style: { textAlign: 'left' } 
                    }
                  }}
                />
                <Typography variant="body1" sx={{ width: '60px' }}>{unit}</Typography>
              </Box>
              <Button
                onClick={() => removeItem(id)}
                sx={{
                  minWidth: 'auto',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  p: 0,
                  bgcolor: '#FFB3BA',
                  color: '#FFF',
                  '&:hover': {
                    bgcolor: '#FF8C9A',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              label="Quantity"
              variant="outlined"
              type="number"
              fullWidth
              value={itemQuantity}
              onChange={(e) => setItemQuantity(Number(e.target.value))}
            />
            <TextField
              label="Unit"
              variant="outlined"
              fullWidth
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName, itemQuantity, itemUnit);
                setItemName('');
                setItemQuantity(1);
                setItemUnit('');
                handleClose();
              }}
            >
              Add
            </Button>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          No {notFoundItem} found in inventory.
        </Alert>
      </Snackbar>
      <RecipeModal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} recipes={recipes} message={recipes.message}/>
      <SavedRecipesModal 
        open={savedRecipeModalOpen} 
        onClose={() => setSavedRecipeModalOpen(false)} 
        recipes={savedRecipes}
        onUpdate={fetchSavedRecipes}
      />
      <footer style={{ textAlign: 'center', marginTop: '50px' }}>
        © Yan Lu 2024
      </footer>
    </Container>
  );
}


// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';
// import { useRouter } from 'next/navigation';
// import { Camera } from 'react-camera-pro';
// import {
//   Box, Stack, Typography, Button, Modal, TextField,
//   Snackbar, Alert, Container, List, ListItem, Avatar,CircularProgress
// } from '@mui/material';
// import DeleteIcon from '@mui/icons-material/Delete';
// import CameraAltIcon from '@mui/icons-material/CameraAlt';
// import { firestore } from '../firebase';
// import RobotIcon from '@mui/icons-material/SmartToy'; // Assuming you have this icon, otherwise import the correct one
// import RecipeModal from './RecipeModal'; // Import the RecipeModal component
// import {
//   collection, addDoc, doc, getDocs, query, where, updateDoc, deleteDoc
// } from 'firebase/firestore';
// import SavedRecipesModal from './SavedRecipesModal';
// import { useAuth } from '@clerk/nextjs';//add829
// import { Toaster, toast } from 'react-hot-toast';//add829
// import { getAuth } from 'firebase/auth';


// const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

// const style = {
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   width: 400,
//   bgcolor: 'white',
//   border: '2px solid #000',
//   boxShadow: 24,
//   p: 4,
//   display: 'flex',
//   flexDirection: 'column',
//   gap: 3,
// };

// export default function Home() {
//   const [cameraOpen, setCameraOpen] = useState(false);
//   const cameraRef = useRef(null);
//   const [numberOfCameras, setNumberOfCameras] = useState(0);
//   const [image, setImage] = useState(null);
//   const [inventory, setInventory] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [itemName, setItemName] = useState('');
//   const [itemQuantity, setItemQuantity] = useState(1);
//   const [itemUnit, setItemUnit] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [notFoundItem, setNotFoundItem] = useState('');
//   const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
//   const [waitlistEmail, setWaitlistEmail] = useState('');
//   const [emailError, setEmailError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const router = useRouter();
//   const [itemModalOpen, setItemModalOpen] = useState(false); // State to control the item modal
//   const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false); // New state variable for success snackbar(add item by photo)
//   const [recipeModalOpen, setRecipeModalOpen] = useState(false);
//   const [recipes, setRecipes] = useState([]);
//   const [message, setMessage] = useState('')
//   const [isLoading, setIsLoading] = useState(false);
//   const [savedRecipes, setSavedRecipes] = useState([]);
//   const [savedRecipeModalOpen, setSavedRecipeModalOpen] = useState(false);
//   const { isSignedIn } = useAuth(); //add829
//   const { userId } = useAuth(); //add829
 
//   const checkAuth = () => {
//     if (!isSignedIn) {
//       // Option 1: Show toast notification
//       toast.error("Please sign in to use this feature.");
      
//       // Option 2: Redirect to sign-in page
//       router.push('/sign-in');
      
//       return false;
//     }
//     return true;
//   };//add829

//   const fetchRecipes = async () => {
//     if (!isSignedIn) {
//       toast.error("Please sign in to view your saved recipes.", {
//         //position: "top-right",  // You can adjust the position of the toast
//         autoClose: 5000,        // Duration in milliseconds
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//       });
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/get-recipes', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ inventory }),
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setRecipes(data.recipes);
//         setRecipeModalOpen(true);
//       } else {
//         console.error('Failed to fetch recipes');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchSavedRecipes = async () => {
//     if (!isSignedIn) {
//       toast.error("Please sign in to view your saved recipes.", {
//        // position: "top-right",  // You can adjust the position of the toast
//         autoClose: 5000,        // Duration in milliseconds
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//       });
//       return;
//     }
//     const snapshot = await getDocs(collection(firestore, 'recipes'));
//     const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     setSavedRecipes(recipes);
//     setSavedRecipeModalOpen(true);
//   };

//   const handleTakePhoto = async () => {
//     if (!isSignedIn) {
//       toast.error("Please sign in to view your saved recipes.", {
//         //position: "top-right",  // You can adjust the position of the toast
//         autoClose: 5000,        // Duration in milliseconds
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//       });
//       return;
//     }
//     if (cameraRef.current) {
//       const screenshot = cameraRef.current.takePhoto();
//       console.log('Screenshot:', screenshot); // Log the screenshot to verify it's captured
  
//       if (screenshot) {
//         // Extract the base64 content and the format
//         const [prefix, base64Content] = screenshot.split(',');
//         const formatMatch = prefix.match(/data:image\/(.*);base64/);
//         const format = formatMatch ? formatMatch[1] : 'jpeg'; // Default to jpeg if format is not found
//         console.log('Base64 Content:', base64Content); // Log the base64 content
//         console.log('Image Format:', format); // Log the image format
  
//         try {
//           const response = await fetch('/api/interpret-image', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ photo: base64Content, format }), // Send base64 content and format
//           });
  
//           if (response.ok) {
//             const data = await response.json();
//             console.log('Item recognized:', data.itemName);
//             setItemName(data.itemName); // Set the item name from the API response
//             setItemModalOpen(true); // Open modal to confirm item details
//             setCameraOpen(false); // Close the camera modal
//             //setSuccessSnackbarOpen({open:true, itemName: data.itemName} ); // Open success snackbar
//           } else {
//             console.error('Failed to interpret image');
//             const errorData = await response.json();
//             console.error('Error data:', errorData); // Log error data
//           }
//         } catch (error) {
//           console.error('Error:', error);
//         }
//       } else {
//         console.error('No screenshot captured');
//       }
//     }
//   };
//   // Handle item modal open and close
// const handleItemModalClose = () => setItemModalOpen(false);

//   const handleOpenWaitlistModal = () => {
//     setWaitlistModalOpen(true);
//     setWaitlistEmail('');
//     setEmailError('');
//     setSuccessMessage('');
//   };

//   const handleCloseWaitlistModal = () => {
//     setWaitlistModalOpen(false);
//     setWaitlistEmail('');
//     setEmailError('');
//     setSuccessMessage('');
//   };

//   const handleAddToWaitlist = async () => {
//     setEmailError('');
//     setSuccessMessage('');

//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail);
//     if (!isValidEmail) {
//       setEmailError('Please enter a valid email address.');
//       return;
//     }

//     try {
//       await addDoc(collection(firestore, 'waitlist'), { email: waitlistEmail });
//       setSuccessMessage('Thank you for joining the waitlist!');
//       setWaitlistEmail('');
//     } catch (error) {
//       console.error("Error adding to waitlist:", error);
//       setEmailError('An error occurred. Please try again later.');
//     }
//   };

//   const updateInventory = async () => {
//     try {
//       const snapshot = await getDocs(query(collection(firestore, 'inventory')));
//       const inventoryList = snapshot.docs.map(doc => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           name: data.name || doc.id,
//           quantity: data.quantity,
//           unit: data.unit,
//         };
//       });
//        // Sort inventoryList alphabetically by name
//       inventoryList.sort((a, b) => a.name.localeCompare(b.name));
//       setInventory(inventoryList);
//     } catch (error) {
//       console.error("Error updating inventory:", error);
//     }
//   };

//   useEffect(() => {
//     updateInventory();
//   }, []);



//   const addItem = async (item, quantity, unit) => {
//     if (!isSignedIn) {
//       toast.error("Please sign in to view your saved recipes.", {
//         //position: "top-right",  // You can adjust the position of the toast
//         autoClose: 5000,        // Duration in milliseconds
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//       });
//       return;
//     }
//     const q = query(collection(firestore, 'inventory'), where("name", "==", item));
//     const querySnapshot = await getDocs(q);

//     if (!querySnapshot.empty) {
//       const existingDoc = querySnapshot.docs[0];
//       const existingData = existingDoc.data();
//       await updateDoc(existingDoc.ref, {
//         quantity: existingData.quantity + quantity,
//         unit: unit,
//       });
//     } else {
//       await addDoc(collection(firestore, 'inventory'), {
//         name: item,
//         quantity: quantity,
//         unit: unit,
//       });
//     }
//     setSuccessSnackbarOpen({ open: true, itemName: item }); // Open success snackbar with item name
//     await updateInventory();
//   };

//   const removeItem = async (id) => {
//     const docRef = doc(collection(firestore, 'inventory'), id);
//     await deleteDoc(docRef);
//     await updateInventory();
//   };

//   const updateQuantity = async (id, newQuantity) => {
//     const docRef = doc(collection(firestore, 'inventory'), id);
//     await updateDoc(docRef, { quantity: newQuantity });
//     await updateInventory();
//   };

//   const handleQuantityChange = (id, newQuantity) => {
//     setInventory(prevInventory =>
//       prevInventory.map(item =>
//         item.id === id ? { ...item, quantity: newQuantity } : item
//       )
//     );
//   };

//   const filteredInventory = inventory.filter(item =>
//     item.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleSearch = (event) => {
//     const term = event.target.value.toLowerCase();
//     setSearchTerm(term);

//     if (term) {
//       const matchingItem = inventory.find(item =>
//         item.name.toLowerCase().includes(term)
//       );

//       if (matchingItem) {
//         const element = document.getElementById(`inventory-item-${matchingItem.id}`);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//         setNotFoundItem('');
//       } else {
//         setNotFoundItem(term);
//         setSnackbarOpen(true);
//       }
//     } else {
//       setNotFoundItem('');
//     }
//   };

//   const handleCloseSnackbar = (event, reason) => {
//     if (reason === 'clickaway') {
//       return;
//     }
//     setSnackbarOpen(false);
//   };

//   const handleOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);

//   return (
//     <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'rgba(0,0,0,0.1)' }}>
//       <Toaster position="top-center" reverseOrder={false} /> {/*add829*/}
//       <Box sx={{
//         position: 'relative',
//         bgcolor: '#E0E0E0',
//         p: 2,
//         mb: 2,
//         borderRadius: '10px',
//         display: 'flex',
//         alignItems: 'center'
//       }}>
//         {isLoading && (
//   <Box sx={{ 
//     position: 'fixed', 
//     top: 0, 
//     left: 0, 
//     width: '100%', 
//     height: '100%', 
//     display: 'flex', 
//     flexDirection: 'column',
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     zIndex: 9999
//   }}>
//     <CircularProgress />
//     <Typography sx={{ mt: 2, color: 'white' }}>AI generating recipes...</Typography>
//   </Box>
// )}
        
//         <Avatar
//           src="/pantrylist.png"
//           alt="Pantry List Logo"
//           sx={{ width: 50, height: 50 }}
//         />
//         <Typography
//           variant="h2"
//           component="h1"
//           sx={{
//             fontFamily: 'Pacifico, cursive',
//             color: '#FF6B6B',
//             flexGrow: 1,
//             textAlign: 'center'
//           }}
//         >
//           Inventory Tracker
//         </Typography>
//         <Button variant="contained" color="primary" onClick={handleOpenWaitlistModal}>
//           Join wait List
//         </Button>
//         <Modal open={waitlistModalOpen} onClose={handleCloseWaitlistModal}>
//           <Box sx={style}>
//             <Typography variant="h6" component="h2">
//               Join the Waitlist. We&apos;ll notify you when the app is ready!
//             </Typography>
//             <TextField
//               label="Email Address"
//               type="email"
//               variant="outlined"
//               value={waitlistEmail}
//               onChange={(e) => {
//                 setWaitlistEmail(e.target.value);
//                 setEmailError('');
//               }}
//               error={!!emailError}
//               helperText={emailError}
//             />
//             {successMessage && <Alert severity="success">{successMessage}</Alert>}
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleAddToWaitlist}
//               disabled={!waitlistEmail || !!emailError}
//             >
//               Join Waitlist
//             </Button>
//           </Box>
//         </Modal>
//       </Box>

//       <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
//         <Button 
//           variant="contained" 
//           onClick={() => setCameraOpen(true)}
//           startIcon={<CameraAltIcon />} 
//         >
//           Take Photo
//         </Button>
//         <Modal open={cameraOpen} onClose={() => setCameraOpen(false)}>
//           <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
//             <Camera ref={cameraRef} aspectRatio={4 / 3} numberOfCamerasCallback={setNumberOfCameras} />
//             <Button
//               onClick={handleTakePhoto}
//               sx={{
//                 position: 'absolute',
//                 bottom: '10px',
//                 left: '50%',
//                 transform: 'translateX(-50%)',
//                 zIndex: 10,
//                 backgroundColor: 'white',
//                 borderRadius: '50%',
//                 padding: '10px',
//               }}
//             >
//               <CameraAltIcon fontSize="large" />
//             </Button>
//             {numberOfCameras > 1 && (
//               <Button
//                 onClick={() => cameraRef.current.switchCamera()}
//                 sx={{
//                   position: 'absolute',
//                   top: '10px',
//                   left: '50%',
//                   transform: 'translateX(-50%)',
//                   zIndex: 10,
//                   backgroundColor: 'white',
//                   borderRadius: '50%',
//                   padding: '10px',
//                 }}
//               >
//                 Switch Camera
//               </Button>
//             )}
//             <Button
//               onClick={() => setCameraOpen(false)}
//               sx={{
//                 position: 'absolute',
//                 bottom: '10px',
//                 right: '10px',
//                 zIndex: 10,
//                 backgroundColor: 'white',
//                 borderRadius: '10px',
//                 padding: '10px',
//               }}
//             >
//               Go Back to Home
//             </Button>
//           </Box>
//         </Modal>
//         <Modal
//           open={itemModalOpen} // Use the itemModalOpen state
//           onClose={handleItemModalClose}
//           aria-labelledby="modal-modal-title"
//           aria-describedby="modal-modal-description"
//         >
//           <Box sx={style}>
//             <Typography id="modal-modal-title" variant="h6" component="h2">
//               Add Item
//             </Typography>
//             <Stack width="100%" direction={'column'} spacing={2}>
//               <TextField
//                 label="Item Name"
//                 variant="outlined"
//                 fullWidth
//                 value={itemName}
//                 onChange={(e) => setItemName(e.target.value)}
//               />
//               <TextField
//                 label="Quantity"
//                 variant="outlined"
//                 type="number"
//                 fullWidth
//                 value={itemQuantity}
//                 onChange={(e) => setItemQuantity(Number(e.target.value))}
//               />
//               <TextField
//                 label="Unit"
//                 variant="outlined"
//                 fullWidth
//                 value={itemUnit}
//                 onChange={(e) => setItemUnit(e.target.value)}
//               />
//               <Button
//                 variant="contained"
//                 onClick={() => {
//                   addItem(itemName, itemQuantity, itemUnit);
//                   setItemName('');
//                   setItemQuantity(1);
//                   setItemUnit('');
//                   handleItemModalClose(); // Close the modal after adding item
//                 }}
//               >
//                 Add
//               </Button>
//               <Button variant="outlined" onClick={handleItemModalClose}>
//                 Cancel
//               </Button>
//             </Stack>
//           </Box>
//         </Modal>
//         <Snackbar
//           open={successSnackbarOpen.open}
//           autoHideDuration={6000}
//           onClose={() => setSuccessSnackbarOpen({ open: false, itemName: '' })}
//         >
//           <Alert onClose={() => setSuccessSnackbarOpen({ open: false, itemName: '' })} severity="success">
//             {successSnackbarOpen.itemName} added successfully!
//           </Alert>
//         </Snackbar>
//         <Button variant="contained" onClick={handleOpen}
//           sx={{ 
//             borderRadius: 20, 
//             backgroundColor: '#FFD166', 
//             color: '#000', 
//             '&:hover': { backgroundColor: '#FFC233' }
//           }}>
//           + New Item
//         </Button>
//         <Button variant="contained" onClick={updateInventory} 
//           sx={{ 
//             borderRadius: 20, 
//             backgroundColor: '#06D6A0', 
//             color: '#000', 
//             '&:hover': { backgroundColor: '#05B384' }
//           }}>
//           ↻ Update
//         </Button>
//         <Button 
//           variant="contained" 
//           onClick={fetchRecipes}
//           startIcon={<RobotIcon />} 
//         >
//           Recipe Generator
//         </Button>
//         <Button variant="contained" onClick={fetchSavedRecipes}>
//           Saved Recipes
//         </Button>

//         <TextField
//           label="Search"
//           variant="outlined"
//           value={searchTerm}
//           onChange={handleSearch}
//           sx={{ width: 250 }}
//         />
//       </Box>

//       <Box sx={{ width: '100%', maxWidth: 800, margin: 'auto', bgcolor: '#FFF3E0' }}>
//         <Typography variant="h4" sx={{ bgcolor: '#FFB74D', p: 2, textAlign: 'center', color: '#FFF' }}>
//           Inventory Items
//         </Typography>
//         <List sx={{ maxHeight: 400, overflow: 'auto' }}>
//           {inventory.map(({id, name, quantity, unit}) => (
//             <ListItem
//               key={id}
//               id={`inventory-item-${id}`}
//               sx={{ 
//                 bgcolor: '#FFECB3', 
//                 mb: 1, 
//                 display: 'flex', 
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 borderRadius: 2
//               }}
//             >
//               <Typography variant="h6">{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
//               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
//                 <TextField
//                   type="number"
//                   value={quantity}
//                   onChange={(e) => {
//                     const newQuantity = Number(e.target.value)
//                     updateQuantity(id, newQuantity)
//                     handleQuantityChange(id, newQuantity)
//                   }}
//                   sx={{ 
//                     width: 100,
//                     minWidth: 80,
//                     mr: 1,
//                     '& input': {
//                       textAlign: 'left',
//                       paddingRight: '8px'
//                     }
//                   }}
//                   InputProps={{
//                     inputProps: { 
//                       min: 0, 
//                       style: { textAlign: 'left' } 
//                     }
//                   }}
//                 />
//                 <Typography variant="body1" sx={{ width: '60px' }}>{unit}</Typography>
//               </Box>
//               <Button
//                 onClick={() => removeItem(id)}
//                 sx={{
//                   minWidth: 'auto',
//                   width: 40,
//                   height: 40,
//                   borderRadius: '50%',
//                   p: 0,
//                   bgcolor: '#FFB3BA',
//                   color: '#FFF',
//                   '&:hover': {
//                     bgcolor: '#FF8C9A',
//                   },
//                 }}
//               >
//                 <DeleteIcon fontSize="small" />
//               </Button>
//             </ListItem>
//           ))}
//         </List>
//       </Box>

//       <Modal
//         open={open}
//         onClose={handleClose}
//         aria-labelledby="modal-modal-title"
//         aria-describedby="modal-modal-description"
//       >
//         <Box sx={style}>
//           <Typography id="modal-modal-title" variant="h6" component="h2">
//             Add Item
//           </Typography>
//           <Stack width="100%" direction={'column'} spacing={2}>
//             <TextField
//               label="Item Name"
//               variant="outlined"
//               fullWidth
//               value={itemName}
//               onChange={(e) => setItemName(e.target.value)}
//             />
//             <TextField
//               label="Quantity"
//               variant="outlined"
//               type="number"
//               fullWidth
//               value={itemQuantity}
//               onChange={(e) => setItemQuantity(Number(e.target.value))}
//             />
//             <TextField
//               label="Unit"
//               variant="outlined"
//               fullWidth
//               value={itemUnit}
//               onChange={(e) => setItemUnit(e.target.value)}
//             />
//             <Button
//               variant="contained"
//               onClick={() => {
//                 addItem(itemName, itemQuantity, itemUnit);
//                 setItemName('');
//                 setItemQuantity(1);
//                 setItemUnit('');
//                 handleClose();
//               }}
//             >
//               Add
//             </Button>
//             <Button variant="outlined" onClick={handleClose}>
//               Cancel
//             </Button>
//           </Stack>
//         </Box>
//       </Modal>

//       <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
//         <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
//           No {notFoundItem} found in inventory.
//         </Alert>
//       </Snackbar>
//       <RecipeModal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} recipes={recipes} message={recipes.message}/>
//       <SavedRecipesModal 
//         open={savedRecipeModalOpen} 
//         onClose={() => setSavedRecipeModalOpen(false)} 
//         recipes={savedRecipes}
//         onUpdate={fetchSavedRecipes}
//       />
//     </Container>
//   );
// }







