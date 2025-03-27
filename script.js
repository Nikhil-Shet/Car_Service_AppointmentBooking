// Helper functions for local storage
function saveBookings(bookings) {
    localStorage.setItem("bookings", JSON.stringify(bookings));
}

function loadBookings() {
    const data = localStorage.getItem("bookings");
    console.log("Raw data from storage:", data);
    try {
        return JSON.parse(data) || [];
    } catch (e) {
        console.error("Error parsing bookings:", e);
        return [];
    }
}

// Function to get the logged-in user
function getLoggedInUser() {
    return localStorage.getItem("loggedInUser"); // Returns the username
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function() {
    // Get DOM elements
    const bookingForm = document.getElementById("bookingForm");
    const bookingList = document.getElementById("bookingList");
    const totalCount = document.getElementById("totalCount");
    const filteredCount = document.getElementById("filteredCount");
    const filterDate = document.getElementById("filterDate");
    const filterButton = document.getElementById("filterButton");

    // Load data
    let bookings = loadBookings();
    let loggedInUser = getLoggedInUser();
    
    console.log("Loaded bookings:", bookings);
    console.log("Logged in user:", loggedInUser);

    // Display bookings in the table
    function displayBookings(bookingsToShow) {
        if (!bookingList) {
            console.error("Booking list element not found");
            return;
        }
        
        bookingList.innerHTML = "";
        
        if (bookingsToShow.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="6">No bookings found</td>`;
            bookingList.appendChild(row);
            return;
        }
        
        bookingsToShow.forEach((booking, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.customerName || ''}</td>
                <td>${booking.vehicleModel || ''}</td>
                <td>${booking.serviceType || ''}</td>
                <td>${booking.serviceDate || ''}</td>
                <td>${booking.username || ''}</td>
                <td>
                    ${(loggedInUser === booking.username || loggedInUser === "admin") ? `
                        <button onclick="editBooking(${index})">Edit</button>
                        <button onclick="deleteBooking(${index})">Delete</button>
                    ` : ""}
                </td>
            `;
            bookingList.appendChild(row);
        });
    }

    // Get bookings filtered by user permissions
    function getFilteredBookings() {
        if (loggedInUser === "admin") {
            return bookings;
        } else {
            return bookings.filter(b => b.username === loggedInUser);
        }
    }

    // Update counter elements
    function updateCounters(filtered = null) {
        if (totalCount) {
            totalCount.textContent = getFilteredBookings().length;
        }
        if (filteredCount && filtered !== null) {
            filteredCount.textContent = filtered;
        }
    }

    // Handle form submission
    if (bookingForm) {
        bookingForm.addEventListener("submit", function(e) {
            e.preventDefault();

            if (!loggedInUser) {
                alert("You must log in first!");
                return;
            }

            // Get form data and trim whitespace
            const customerNameInput = document.getElementById("customerName");
            const vehicleModelInput = document.getElementById("vehicleModel");
            const serviceTypeInput = document.getElementById("serviceType");
            const serviceDateInput = document.getElementById("serviceDate");
            const descriptionInput = document.getElementById("description");
            
            if (!customerNameInput || !vehicleModelInput || !serviceTypeInput || !serviceDateInput) {
                console.error("Required form fields not found");
                return;
            }

            const customerName = customerNameInput.value.trim();
            const vehicleModel = vehicleModelInput.value.trim();
            const serviceType = serviceTypeInput.value.trim();
            const serviceDate = serviceDateInput.value.trim();
            const description = descriptionInput ? descriptionInput.value.trim() : "";

            // Debug: Log the values
            console.log("Form values:", {
                customerName, vehicleModel, serviceType, serviceDate, description
            });

            // Validate required fields
            if (!customerName || !vehicleModel || !serviceType || !serviceDate || !description) {
                alert("Please fill in all required fields.");
                return;
            }

            // Create booking object
            const booking = {
                customerName,
                vehicleModel,
                serviceType,
                serviceDate,
                description,
                username: loggedInUser,
                id: Date.now().toString() // Add unique ID for each booking
            };

            const submitButton = bookingForm.querySelector("button[type='submit']");
            const editIndex = submitButton.getAttribute("data-edit-index");

            if (editIndex !== null && editIndex !== undefined) {
                // Update existing booking
                console.log("Updating booking at index:", editIndex);
                bookings[parseInt(editIndex)] = booking;
                submitButton.textContent = "Add Booking";
                submitButton.removeAttribute("data-edit-index");
            } else {
                // Add new booking
                console.log("Adding new booking");
                bookings.push(booking);
            }

            // Save bookings and update display
            saveBookings(bookings);
            displayBookings(getFilteredBookings());
            updateCounters();
            bookingForm.reset();
        });
    }

    // Handle filter button
    if (filterButton) {
        filterButton.addEventListener("click", function() {
            const selectedDate = filterDate.value;
            if (!selectedDate) {
                alert("Please select a date to filter.");
                return;
            }
            
            const filteredBookings = getFilteredBookings().filter(b => b.serviceDate === selectedDate);
            displayBookings(filteredBookings);
            updateCounters(filteredBookings.length);
        });
    }

    // Delete booking function
    window.deleteBooking = function(index) {
        console.log("Deleting booking at index:", index);
        const filteredBookings = getFilteredBookings();
        if (index < 0 || index >= filteredBookings.length) {
            console.error("Invalid index for deletion:", index);
            return;
        }
        
        const bookingToDelete = filteredBookings[index];
        console.log("Booking to delete:", bookingToDelete);

        // Find the actual index in the full bookings array
        const actualIndex = bookings.findIndex(b => 
            b.customerName === bookingToDelete.customerName &&
            b.vehicleModel === bookingToDelete.vehicleModel &&
            b.serviceType === bookingToDelete.serviceType &&
            b.serviceDate === bookingToDelete.serviceDate &&
            b.username === bookingToDelete.username
        );

        console.log("Actual index in bookings array:", actualIndex);

        if (actualIndex !== -1) {
            bookings.splice(actualIndex, 1); // Remove the booking
            saveBookings(bookings); // Save updated bookings
            displayBookings(getFilteredBookings()); // Refresh the display
            updateCounters(); // Update counters
        } else {
            console.error("Could not find booking to delete");
        }
    };

    // Edit booking function
    window.editBooking = function(index) {
        console.log("Editing booking at index:", index);
        const filteredBookings = getFilteredBookings();
        if (index < 0 || index >= filteredBookings.length) {
            console.error("Invalid index for editing:", index);
            return;
        }
        
        const bookingToEdit = filteredBookings[index];
        console.log("Booking to edit:", bookingToEdit);

        // Find the actual index in the full bookings array
        const actualIndex = bookings.findIndex(b => 
            b.customerName === bookingToEdit.customerName &&
            b.vehicleModel === bookingToEdit.vehicleModel &&
            b.serviceType === bookingToEdit.serviceType &&
            b.serviceDate === bookingToEdit.serviceDate &&
            b.username === bookingToEdit.username
        );

        console.log("Actual index in bookings array:", actualIndex);

        if (actualIndex !== -1) {
            const booking = bookings[actualIndex];
            
            // Check if form elements exist
            const customerNameInput = document.getElementById("customerName");
            const vehicleModelInput = document.getElementById("vehicleModel");
            const serviceTypeInput = document.getElementById("serviceType");
            const serviceDateInput = document.getElementById("serviceDate");
            const descriptionInput = document.getElementById("description");
            
            if (!customerNameInput || !vehicleModelInput || !serviceTypeInput || !serviceDateInput) {
                console.error("Form elements not found");
                return;
            }

            // Populate the form with the booking details
            customerNameInput.value = booking.customerName || '';
            vehicleModelInput.value = booking.vehicleModel || '';
            serviceTypeInput.value = booking.serviceType || '';
            serviceDateInput.value = booking.serviceDate || '';
            if (descriptionInput) {
                descriptionInput.value = booking.description || '';
            }

            // Change the submit button to "Update Booking"
            const submitButton = bookingForm.querySelector("button[type='submit']");
            if (submitButton) {
                submitButton.textContent = "Update Booking";
                submitButton.setAttribute("data-edit-index", actualIndex);
            } else {
                console.error("Submit button not found");
            }
        } else {
            console.error("Could not find booking to edit");
        }
    };

    // Initialize display
    displayBookings(getFilteredBookings());
    updateCounters();
});