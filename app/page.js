"use client"
import { Box, Typography, Button, Modal, TextField, Stack } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { firestore } from "@/firebase";
import { collection, query, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import dayjs from "dayjs"; // Import dayjs to handle dates

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
  display: "flex",
  flexDirection: "column",
  gap: 3
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [expirationDate, setExpirationDate] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setItemName("");
    setExpirationDate(null);
    setOpen(false);
  };

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, "pantry"));
    const docs = await getDocs(snapshot);
    const pantryList = [];
    docs.forEach((doc) => {
      pantryList.push({ name: doc.id, ...doc.data() });
    });
    setPantry(pantryList);
  };

  useEffect(() => {
    updatePantry();
  }, []);

  const countItem = async (item, delta) => {
    const docRef = doc(collection(firestore, "pantry"), item);
    const docSnap = await getDoc(docRef);
    const formattedDate = expirationDate ? expirationDate.toISOString() : null;

    if (docSnap.exists()) {
      const { count, expirationDates } = docSnap.data();
      const newCount = count + delta;
      if (newCount <= 0) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          count: newCount,
          expirationDates: delta > 0 ? [...expirationDates, formattedDate].filter(Boolean) : expirationDates.slice(1)
        });
      }
    } else if (delta > 0) {
      await setDoc(docRef, {
        count: 1,
        expirationDates: [formattedDate].filter(Boolean)
      });
    }
    await updatePantry();
  };

  const addItem = async () => {
    await countItem(itemName, 1);
    handleClose();
  };

  const removeItem = async (item) => {
    await countItem(item, -1);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box width="100vw" height="100vh" display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"column"} gap={2}
      sx={{
        backgroundImage: 'url("https://png.pngtree.com/thumb_back/fh260/background/20230524/pngtree-warehousestyle-food-pantry-located-in-london-image_2692939.jpg")', // Replace with your image URL
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      >
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
            <Stack direction={"column"} width="100%" spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <DatePicker
                label="Expiration Date"
                value={expirationDate}
                onChange={(newValue) => setExpirationDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <Button
                variant="outlined"
                onClick={addItem}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Button variant="contained" onClick={handleOpen}>Add</Button>
        <Box border={"1px solid #333"}>
          <Box width="800px" height="100px" bgcolor={"#add8e6"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <Typography variant={"h2"} color={"#333"} textAlign={"center"}>
              Pantry Items
            </Typography>
          </Box>
          <Stack width="800px" height="300px" spacing={2} overflow={"auto"}>
            {pantry.map(({ name, count, expirationDates }) => (
              <Box key={name} width="100%" minHeight="150px" display={"flex"} justifyContent={"space-between"} alignItems={"center"} bgcolor={"#f0f0f0"} paddingX={5}>
                <Box>
                  <Typography variant={"h3"} color={"#333"} textAlign={"center"}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  {expirationDates && expirationDates.map((date, index) => (
                    <Typography key={index} variant={"body1"} color={"#333"} textAlign={"center"}>
                      Expires on: {new Date(date).toLocaleDateString()}
                    </Typography>
                  ))}
                </Box>
                <Typography variant={"h3"} color={"#333"} textAlign={"center"}>
                  Count: {count}
                </Typography>
                <Button variant="contained" onClick={() => removeItem(name)}>Remove</Button>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
