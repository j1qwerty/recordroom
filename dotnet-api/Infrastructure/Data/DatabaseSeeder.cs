using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;

namespace RecordRoom.Api.Infrastructure.Data;

/// <summary>
/// Seeds the same dataset the frontend ships, so switching the UI from the
/// local adapter to this API shows the same rooms, files and receipts.
/// Runs only when the registry table is empty.
/// </summary>
public static class DatabaseSeeder
{
    public const string DemoPassword = "Demo@12345";

    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Files.AnyAsync(ct))
        {
            logger.LogInformation("Seed skipped: the registry already has rows.");
            return;
        }

        logger.LogInformation("Seeding database...");

        // ------------------------------------------------------------ identities
        foreach (var (code, prefix, name, father, gender, dept, desig, role) in new[]
        {
            ("EMP0001", "LK", "Ramesh Kumar", "Shri Ram Kumar", "Male", "Establishment", "Sectional Officer", Role.Operator),
            ("EMP0002", "LK", "Sneha Verma", "Shri Ramesh Verma", "Female", "Revenue", "Assistant Commissioner", Role.Supervisor),
            ("EMP0003", "LK", "Imran Sheikh", "Shri Salim Sheikh", "Male", "Audit", "Audit Inspector", Role.Employee),
            ("EMP0004", "LK", "Priya Nair", "Shri M. Nair", "Female", "Education", "Deputy Director", Role.Supervisor),
            ("EMP0005", "LK", "Anil Yadav", "Shri Dinesh Yadav", "Male", "HR", "Head of Section", Role.Supervisor),
            ("EMP0006", "LK", "Farida Begum", "Shri A. Begum", "Female", "Engineering", "Executive Engineer", Role.Admin),
            ("EMP0007", "LK", "Vikas Tiwari", "Shri R. Tiwari", "Male", "PERSONNEL", "Clerk", Role.Employee),
            ("EMP0008", "LK", "Neha Srivastava", "Shri A. Srivastava", "Female", "COMMERCIAL", "Accounts Assistant", Role.Employee),
        })
        {
            db.Employees.Add(new Employee
            {
                EmployeeCode = code,
                Prefix = prefix,
                Name = name,
                FatherName = father,
                Gender = gender,
                Department = dept,
                Designation = desig,
                Role = role,
                Email = $"{name.Split(' ')[0].ToLower()}@lko.drm.local",
                Mobile = $"9837{code[3..]}{(int.Parse(code[3..]) * 7 % 10000):D4}",
                Pan = "DEMO" + code[3..],
                Aadhaar = "XXXX-XXXX-" + code[3..],
                GradePay = "6600",
                PayScale = "12000-20000",
                Status = EmployeeStatus.Active,
            });
        }
        await db.SaveChangesAsync(ct);

        foreach (var (userName, display, role, empCode, active) in new[]
        {
            ("admin", "Farida Begum", Role.Admin, "EMP0006", true),
            ("supervisor", "Sneha Verma", Role.Supervisor, "EMP0002", true),
            ("operator", "Ramesh Kumar", Role.Operator, "EMP0001", true),
            ("employee", "Imran Sheikh", Role.Employee, "EMP0003", true),
            ("deputy.ceo", "Anil Yadav", Role.Supervisor, "EMP0005", false),
        })
        {
            var (hash, salt) = PasswordHasher.Create(DemoPassword);
            db.Users.Add(new AppUser
            {
                UserName = userName,
                DisplayName = display,
                Role = role,
                EmployeeCode = empCode,
                Active = active,
                PasswordHash = hash,
                PasswordSalt = salt,
            });
        }

        foreach (var (name, pincode, active) in new[]
        {
            ("AARI", "226001", true), ("AMBABAY", "226002", true), ("ATHODNA", "226003", true),
            ("BADORA", "226004", true), ("BAJNA", "226005", true), ("GOMTINAGAR", "226010", true),
            ("HASANGANJ", "226011", false),
        })
        {
            db.Areas.Add(new Area { Name = name, Pincode = pincode, Active = active });
        }
        await db.SaveChangesAsync(ct);

        // -------------------------------------------------------- location tree
        // Section count x 2 almirahs per section fixes the code range. These
        // ranges are chosen so every almirah referenced by the file seeds below
        // actually exists; otherwise a file would land with no shelf.
        var rooms = new[]
        {
            (Code: "RM-001", Name: "Record Room 01", Bldg: "BLD-001", Floor: "FL-01", Occ: 78, Cap: 92, Status: RoomStatus.Operational, Sections: new[] { "A", "B", "C" }, Start: 1),
            (Code: "RM-002", Name: "Record Room 02", Bldg: "BLD-001", Floor: "FL-01", Occ: 54, Cap: 64, Status: RoomStatus.Operational, Sections: new[] { "A", "B", "C", "D" }, Start: 9),
            (Code: "RM-003", Name: "Record Room 03", Bldg: "BLD-002", Floor: "FL-02", Occ: 91, Cap: 96, Status: RoomStatus.Maintenance, Sections: new[] { "A" }, Start: 17),
        };

        foreach (var r in rooms)
        {
            var room = new Room
            {
                Code = r.Code,
                Name = r.Name,
                Building = r.Bldg,
                Floor = r.Floor,
                Occupancy = r.Occ,
                Capacity = r.Cap,
                Status = r.Status,
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync(ct);

            var sectionIds = new List<int>();
            foreach (var name in r.Sections)
            {
                var section = new Section
                {
                    RoomId = room.Id,
                    Code = $"SEC-{name}",
                    Name = name,
                    Status = name == "C" ? StorageStatus.Inactive : StorageStatus.Active,
                };
                db.Sections.Add(section);
                await db.SaveChangesAsync(ct);
                sectionIds.Add(section.Id);
            }

            var unitIndex = r.Start;
            foreach (var sectionId in sectionIds)
            {
                for (var i = 0; i < 2; i++)
                {
                    var code = $"A-{unitIndex:000}";
                    var unit = new StorageUnit
                    {
                        RoomId = room.Id,
                        SectionId = sectionId,
                        Code = code,
                        Name = $"Almirah {unitIndex:000}",
                        Barcode = $"{r.Code.Replace("-", string.Empty)}{unitIndex:000}",
                        // A-010 stays non-active so the guards have a real target.
                        Status = code == "A-010" ? StorageStatus.Maintenance : StorageStatus.Active,
                        X = i == 0 ? 8 : 54,
                        Y = 10,
                        Width = i == 0 ? 18 : 22,
                        Height = 76,
                    };
                    db.StorageUnits.Add(unit);
                    await db.SaveChangesAsync(ct);

                    var statuses = new[]
                    {
                        StorageStatus.Active, StorageStatus.Active,
                        StorageStatus.Active, StorageStatus.Maintenance,
                    };
                    for (var s = 0; s < 4; s++)
                    {
                        db.Shelves.Add(new Shelf
                        {
                            StorageUnitId = unit.Id,
                            Barcode = $"{r.Code.Replace("-", string.Empty)}{code.Replace("-", string.Empty)}SH{s + 1:00}",
                            Code = $"{code}-S-{s + 1:00}",
                            Name = $"Shelf {s + 1}",
                            Status = statuses[s],
                            Capacity = 80,
                            PositionOrder = s,
                        });
                    }
                    await db.SaveChangesAsync(ct);
                    // Consecutive codes: two almirahs per section, so 1,2 then 3,4.
                    unitIndex++;
                }
            }
        }

        // ------------------------------------------------------------------ files
        var fileSeeds = new[]
        {
            ("RF-0000124587", "REV/2021/4587", "Land acquisition review for NH-2 alignment", "Revenue", 2021, FileKind.File, "A-005", 3, 67, "ATHODNA", RecordStatus.Available, 1500),
            ("RF-0000123144", "EST/2019/3144", "Establishment pension settlement case file", "Establishment", 2019, FileKind.File, "A-003", 2, 34, "GOMTINAGAR", RecordStatus.Issued, 1620),
            ("RF-0000177021", "REV/2023/7021", "Village road widening compensation", "Revenue", 2023, FileKind.File, "A-001", 1, 42, "BADORA", RecordStatus.Available, 900),
            ("RF-0000199103", "AUD/2024/9103", "Internal audit observations 2023-24", "Audit", 2024, FileKind.Report, "A-009", 2, 18, "AMBABAY", RecordStatus.UnderDigitization, 620),
            ("RF-0000111198", "EDU/2018/1198", "School grant utilization statement", "Education", 2018, FileKind.Letter, "A-010", 3, 51, "AARI", RecordStatus.Available, 1900),
            ("RF-0000142214", "HR/2022/2214", "Departmental recruitment panel 2022", "HR", 2022, FileKind.File, "A-010", 1, 73, "BAJNA", RecordStatus.Available, 1100),
            ("RF-0000204551", "ENG/2025/4551", "Bridge inspection drawings and estimates", "Engineering", 2025, FileKind.Drawing, "A-013", 3, 12, "GOMTINAGAR", RecordStatus.Available, 240),
            ("RF-0000204552", "ENG/2025/4552", "Culvert replacement sanctioned estimate", "Engineering", 2025, FileKind.Drawing, "A-013", 4, 27, "GOMTINAGAR", RecordStatus.Issued, 235),
            ("RF-0000204990", "COM/2025/4990", "Revenue collection ledger 2024-25", "COMMERCIAL", 2025, FileKind.Register, "A-014", 1, 88, "HASANGANJ", RecordStatus.Available, 200),
            ("RF-0000166002", "PER/2020/6002", "Personnel transfer orders 2020", "PERSONNEL", 2020, FileKind.File, "A-006", 2, 55, "AARI", RecordStatus.Available, 1700),
            ("RF-0000166019", "PER/2020/6019", "Superannuation roster corrections", "PERSONNEL", 2020, FileKind.Register, "A-006", 3, 63, "AARI", RecordStatus.Missing, 1680),
            ("RF-0000111880", "EDU/2018/1880", "District literacy campaign map set", "Education", 2018, FileKind.Map, "A-015", 4, 9, "ATHODNA", RecordStatus.Available, 2000),
            ("RF-0000111881", "EDU/2018/1881", "School infrastructure survey maps", "Education", 2018, FileKind.Map, "A-015", 1, 14, "ATHODNA", RecordStatus.UnderDigitization, 1995),
            ("RF-0000111999", "AUD/2019/1999", "Audit of revenue receipt accounts", "Audit", 2019, FileKind.Report, "A-011", 4, 77, "AMBABAY", RecordStatus.Archived, 2100),
        };

        var units = await db.StorageUnits.Include(u => u.Shelves).ToListAsync(ct);
        var areasByName = await db.Areas.ToDictionaryAsync(a => a.Name, ct);
        var unbound = new List<string>();

        foreach (var (barcode, number, subject, dept, year, kind, unitCode, shelfNo, pos, area, status, ageDays) in fileSeeds)
        {
            var unit = units.FirstOrDefault(u => u.Code == unitCode);
            if (unit is null)
            {
                // Loud on purpose: a silently dropped row looks like a successful
                // seed but leaves the file unreachable in the UI.
                unbound.Add($"{barcode}: almirah {unitCode} missing");
                continue;
            }

            var shelf = unit.Shelves.FirstOrDefault(s => s.Code == $"{unitCode}-S-{shelfNo:00}");
            if (shelf is null)
            {
                unbound.Add($"{barcode}: shelf {unitCode}-S-{shelfNo:00} missing");
                continue;
            }

            var created = DateTime.UtcNow.AddDays(-ageDays);
            db.Files.Add(new RecordFile
            {
                Barcode = barcode,
                FileNumber = number,
                Subject = subject,
                Department = dept,
                Year = year,
                FileKind = kind,
                Status = status,
                ShelfId = shelf.Id,
                RoomId = unit.RoomId,
                SectionId = unit.SectionId,
                AlmirahId = unit.Id,
                ShelfBarcode = shelf.Barcode,
                ApproxPosition = pos,
                Pincode = areasByName.TryGetValue(area, out var found) ? found.Pincode : string.Empty,
                Area = area,
                PropertyNo = "PROP-" + barcode[^4..],
                PropertyArea = "1.0 hectare",
                Dealer = "Seeded dealer",
                CodalLife = "25 years",
                CreatedAt = created,
                CreatedBy = "seed",
                UpdatedAt = created.AddDays(5),
                UpdatedBy = "seed",
                LastMovementAt = DateTime.UtcNow.AddDays(-5),
                Holder = status == RecordStatus.Issued ? "Seeded borrower" : null,
                Description = subject + " - seeded registry row.",
            });
            shelf.Occupied += 1;
        }

        await db.SaveChangesAsync(ct);

        if (unbound.Count > 0)
        {
            logger.LogWarning("Seed left {Count} file row(s) unbound: {Detail}",
                unbound.Count, string.Join("; ", unbound));
        }

        // -------------------------------------------------- digitization + receipts
        var files = await db.Files.ToListAsync(ct);

        var batchSeed = new (string Code, string Emp, DigitizationFolder Folder, BatchStatus Status)[]
        {
            ("BATCH-041", "EMP0003", DigitizationFolder.Apar, BatchStatus.Approved),
            ("BATCH-040", "EMP0004", DigitizationFolder.LeaveReport, BatchStatus.PartiallyApproved),
            ("BATCH-039", "EMP0001", DigitizationFolder.ServiceBook, BatchStatus.Submitted),
        };

        // One distinct target per batch: (barcode, pageNo, version) is unique
        // across the table, so two batches scanning one page would collide.
        var targets = files.Where(f => f.Status == RecordStatus.UnderDigitization).ToList();
        while (targets.Count < batchSeed.Length)
        {
            var extra = files.FirstOrDefault(f => !targets.Contains(f));
            if (extra is null) break;
            targets.Add(extra);
        }

        for (var b = 0; b < batchSeed.Length; b++)
        {
            var (code, empCode, folder, status) = batchSeed[b];
            var emp = await db.Employees.FirstAsync(e => e.EmployeeCode == empCode, ct);
            var batch = new DigitizationBatch
            {
                Code = code,
                EmployeeCode = emp.EmployeeCode,
                EmployeeName = emp.Name,
                Department = emp.Department,
                Folder = folder,
                Status = status,
                CreatedAt = DateTime.UtcNow.AddDays(-4),
                CreatedBy = "seed",
                SubmittedAt = status == BatchStatus.InProgress ? null : DateTime.UtcNow.AddDays(-2),
            };
            db.Batches.Add(batch);
            await db.SaveChangesAsync(ct);

            var target = targets[b % targets.Count];
            var pageStatus = status switch
            {
                BatchStatus.Approved => new[] { PageStatus.Approved, PageStatus.Approved },
                BatchStatus.PartiallyApproved => new[] { PageStatus.Approved, PageStatus.Rejected },
                _ => new[] { PageStatus.PendingReview, PageStatus.PendingReview },
            };

            for (var p = 0; p < pageStatus.Length; p++)
            {
                db.Pages.Add(new DigitizationPage
                {
                    BatchId = batch.Id,
                    Barcode = target.Barcode,
                    FileName = $"{target.Barcode}-FILE-{p + 1}.pdf",
                    PageNo = p + 1,
                    Version = 1,
                    Status = pageStatus[p],
                    Note = pageStatus[p] == PageStatus.Rejected
                        ? "Skew beyond 5 degree tolerance"
                        : string.Empty,
                    UploadedAt = DateTime.UtcNow.AddDays(-3),
                    UploadedBy = "seed",
                });
            }
        }
        await db.SaveChangesAsync(ct);

        foreach (var (receipt, name, code, dept, purpose, barcodes, daysAgo, dueInDays, status) in new[]
        {
            ("ISS-2026-0001", "Ramesh Kumar", "EMP0001", "Establishment", "Pension settlement verification", new[] { "RF-0000123144", "RF-0000142214" }, 4, 10, IssueStatus.Issued),
            ("ISS-2026-0002", "Farida Begum", "EMP0006", "Engineering", "Estimate compliance review", new[] { "RF-0000204552" }, 2, 5, IssueStatus.Issued),
            ("ISS-2026-0003", "Imran Sheikh", "EMP0003", "Audit", "Audit fieldwork sample", new[] { "RF-0000166019", "RF-0000111999", "RF-0000166002" }, 9, 1, IssueStatus.Overdue),
            ("ISS-2026-0004", "Priya Nair", "EMP0004", "Education", "Grant utilisation reconciliation", new[] { "RF-0000111198", "RF-0000111881" }, 26, -6, IssueStatus.PartiallyReturned),
        })
        {
            var issuedAt = DateTime.UtcNow.AddDays(-daysAgo);
            var issue = new IssueReceipt
            {
                ReceiptNumber = receipt,
                BorrowerIsEmployee = true,
                BorrowerName = name,
                BorrowerEmployeeCode = code,
                Department = dept,
                Purpose = purpose,
                IssuedAt = issuedAt,
                DueAt = DateTime.UtcNow.AddDays(dueInDays),
                Status = status,
                IssuedBy = "seed",
                CreatedAt = issuedAt,
            };
            db.Issues.Add(issue);
            await db.SaveChangesAsync(ct);

            for (var i = 0; i < barcodes.Length; i++)
            {
                var f = files.FirstOrDefault(x => x.Barcode == barcodes[i]);
                if (f is null) continue;
                db.IssueLines.Add(new IssueLine
                {
                    IssueReceiptId = issue.Id,
                    RecordFileId = f.Id,
                    Barcode = f.Barcode,
                    ReturnedAt = status == IssueStatus.PartiallyReturned && i == 0
                        ? DateTime.UtcNow.AddDays(-12)
                        : null,
                });
            }
        }
        await db.SaveChangesAsync(ct);

        foreach (var (bc, pageNo, version, status, size) in new[]
        {
            ("RF-0000111880", 1, 1, PageStatus.Approved, 2840),
            ("RF-0000111880", 2, 1, PageStatus.Approved, 3015),
            ("RF-0000111881", 1, 1, PageStatus.PendingReview, 2670),
            ("RF-0000124587", 1, 2, PageStatus.Approved, 3380),
        })
        {
            db.Maps.Add(new MapUpload
            {
                Barcode = bc,
                FileName = $"{bc}-MAP-{pageNo}.png",
                PageNo = pageNo,
                Version = version,
                Status = status,
                SizeKb = size,
                UploadedAt = DateTime.UtcNow.AddDays(-10),
                UploadedBy = "seed",
            });
        }

        db.Audit.Add(new AuditEntry
        {
            Action = AuditAction.Create,
            Entity = "RecordFile",
            EntityId = "seed",
            Actor = "system",
            Role = nameof(Role.Admin),
            At = DateTime.UtcNow.AddDays(-30),
            Ip = "127.0.0.1",
            Before = "-",
            After = "seed",
            Summary = "Database seeded with the demo dataset",
        });

        foreach (var f in files.Take(6))
        {
            db.Movements.Add(new MovementEvent
            {
                Kind = MovementKind.FileCreated,
                RecordFileId = f.Id,
                Barcode = f.Barcode,
                Subject = f.Subject,
                From = "-",
                To = f.LocationDisplay,
                Actor = "seed",
                At = f.CreatedAt,
                Detail = "Created during seed.",
            });
        }

        await db.SaveChangesAsync(ct);

        // Ids are assigned now, so the display path can be built.
        await RefreshLocationDisplayAsync(db, ct);

        logger.LogInformation(
            "Seeded {Rooms} rooms, {Files} files, {Batches} batches, {Issues} receipts.",
            await db.Rooms.CountAsync(ct),
            await db.Files.CountAsync(ct),
            await db.Batches.CountAsync(ct),
            await db.Issues.CountAsync(ct));
    }

    /// <summary>
    /// Rebuilds the human-readable room / section / almirah / shelf path for
    /// every file. Stored rather than joined per row so list endpoints return a
    /// location string without a four-table join.
    /// </summary>
    public static async Task RefreshLocationDisplayAsync(AppDbContext db, CancellationToken ct = default)
    {
        var shelves = await db.Shelves
            .Include(s => s.StorageUnit!).ThenInclude(u => u.Section!)
            .ToListAsync(ct);
        var rooms = await db.Rooms.ToDictionaryAsync(r => r.Id, ct);

        var files = await db.Files.Where(f => f.ShelfId != null).ToListAsync(ct);
        foreach (var f in files)
        {
            var shelf = shelves.FirstOrDefault(s => s.Id == f.ShelfId);
            if (shelf?.StorageUnit is null) continue;
            var unit = shelf.StorageUnit;
            rooms.TryGetValue(unit.RoomId, out var room);
            f.LocationDisplay = string.Join(" / ",
                new[] { room?.Code, unit.Section?.Code, unit.Code, shelf.Code }
                    .Where(s => !string.IsNullOrWhiteSpace(s)));
        }

        await db.SaveChangesAsync(ct);
    }
}