export function serializePastor(pastor: any) {
  return {
    ...pastor,
    id: pastor._id.toString(),
    church: pastor.church ? pastor.church.toString() : "",
    council: Array.isArray(pastor.council) ? pastor.council : pastor.council ? [pastor.council] : [],
    date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    date_of_appointment: pastor.date_of_appointment
      ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
      : "",
    first_name: pastor.first_name || "",
    middle_name: pastor.middle_name || "",
    last_name: pastor.last_name || "",
    function: Array.isArray(pastor.function) ? pastor.function : pastor.function ? [pastor.function] : [],
  };
}
