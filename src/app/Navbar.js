"use client";

import { SignedIn, SignedOut, UserButton, SignUp, SignInButton } from "@clerk/nextjs";
import { AppBar, Box, Button, Grid, Toolbar, Typography, Container, Stack } from "@mui/material";
import { useAuth } from '@clerk/nextjs'; // Clerk Auth
import { useRouter } from 'next/navigation';

const { isSignedIn, userId } = useAuth(); // Clerk Auth
const router = useRouter();


  
function Navbar() {
  return (
    <>      
    {/* ===== NAVIGATION BAR SECTION ===== */}
      <AppBar position="static" sx={{ bgcolor:'#004d40' }}> {/* Deep green background */}
        <Toolbar>
          <Grid container alignItems={'start'} justifyContent={'space-between'}>            
            <Button color="inherit" href="/">
              <Typography variant="h4" style={{flexGrow: 1}}>
                Inventory Tracker
              </Typography>
            </Button>
            <Stack direction={'row'} spacing={3} alignItems={'center'} justifyContent={'space-between'} sx={{ mt: 1 }}>
              <SignedOut>
                <Button color="inherit" href="/sign-in" sx={{ '&:hover': {color: '#e0f7fa'}, textDecoration: 'none', }}>Sign In</Button> {/* Light teal hover */}
                <Button color="inherit" href="/sign-up" sx={{ '&:hover': {color: '#e0f7fa'}, textDecoration: 'none', }}>Sign Up</Button> {/* Light teal hover */}
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </Stack>
          </Grid>
        </Toolbar>
      </AppBar>
    </>
  )
}

export default Navbar;