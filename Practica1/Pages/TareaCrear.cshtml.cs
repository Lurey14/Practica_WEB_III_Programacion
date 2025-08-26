using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Practica1.Models;
using System.Text.Json;

namespace Practica1.Pages
{
    public class TareaCrearModel : PageModel
    {
        public IActionResult OnGet()
        {
            return Page();
        }

        public IActionResult OnPost(string nombreTarea, string fechaVencimiento, string estado)
        {
            try
            {
                if (DateTime.TryParse(fechaVencimiento, out DateTime fechaVenc))
                {
                    fechaVencimiento = fechaVenc.ToString("dd/MM/yyyy");
                }
                var nuevaTarea = new Tarea
                {
                    nombreTarea = nombreTarea,
                    fechaVencimiento = fechaVencimiento,
                    estado = estado
                };

                string jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "tareas.json");
                List<Tarea> tareas = new List<Tarea>();

                if (System.IO.File.Exists(jsonFilePath))
                {
                    var jsonContent = System.IO.File.ReadAllText(jsonFilePath);
                    tareas = JsonSerializer.Deserialize<List<Tarea>>(jsonContent) ?? new List<Tarea>();
                }

                tareas.Add(nuevaTarea);

                var options = new JsonSerializerOptions { WriteIndented = true };
                string jsonString = JsonSerializer.Serialize(tareas, options);
                System.IO.File.WriteAllText(jsonFilePath, jsonString);

                return RedirectToPage("/Index");
            }
            catch (Exception ex)
            {
                return Page();
            }
        }
    }
}
